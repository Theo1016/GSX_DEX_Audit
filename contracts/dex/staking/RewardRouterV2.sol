// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";
import "../libraries/token/SafeERC20.sol";
import "../libraries/utils/ReentrancyGuard.sol";
import "../libraries/utils/Address.sol";

import "./interfaces/IRewardTracker.sol";
import "./interfaces/IRewardRouterV2.sol";
import "./interfaces/IVester.sol";
import "../tokens/interfaces/IMintable.sol";
import "../tokens/interfaces/IWETH.sol";
import "../core/interfaces/IGspManager.sol";
import "../access/Governable.sol";

contract RewardRouterV2 is IRewardRouterV2, ReentrancyGuard, Governable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address payable;

    bool public isInitialized;

    address public weth;

    address public gsx;
    address public esGsx;

    address public gsp; // GSX Liquidity Provider token

    address public override stakedGspTracker;
    address public override feeGspTracker;

    address public gspManager;

    address public gspVester;

    mapping (address => address) public pendingReceivers;

    event StakeGsp(address account, uint256 amount);
    event UnstakeGsp(address account, uint256 amount);

    receive() external payable {
        require(msg.sender == weth, "Router: invalid sender");
    }

    function initialize(
        address _weth,
        address _gsx,
        address _esGsx,
        address _gsp,
        address _feeGspTracker,
        address _stakedGspTracker,
        address _gspManager,
        address _gspVester
    ) external onlyGov {
        require(!isInitialized, "RewardRouter: already initialized");
        isInitialized = true;

        weth = _weth;

        gsx = _gsx;
        esGsx = _esGsx;

        gsp = _gsp;

        feeGspTracker = _feeGspTracker;
        stakedGspTracker = _stakedGspTracker;

        gspManager = _gspManager;

        gspVester = _gspVester;
    }

    // to help users who accidentally send their tokens to this contract
    function withdrawToken(address _token, address _account, uint256 _amount) external onlyGov {
        IERC20(_token).safeTransfer(_account, _amount);
    }

    function mintAndStakeGsp(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minGsp) external nonReentrant returns (uint256) {
        require(_amount > 0, "RewardRouter: invalid _amount");

        address account = msg.sender;
        uint256 gspAmount = IGspManager(gspManager).addLiquidityForAccount(account, account, _token, _amount, _minUsdg, _minGsp);
        IRewardTracker(feeGspTracker).stakeForAccount(account, account, gsp, gspAmount);
        IRewardTracker(stakedGspTracker).stakeForAccount(account, account, feeGspTracker, gspAmount);

        emit StakeGsp(account, gspAmount);

        return gspAmount;
    }

    function mintAndStakeGspETH(uint256 _minUsdg, uint256 _minGsp) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "RewardRouter: invalid msg.value");

        IWETH(weth).deposit{value: msg.value}();
        IERC20(weth).approve(gspManager, msg.value);

        address account = msg.sender;
        uint256 gspAmount = IGspManager(gspManager).addLiquidityForAccount(address(this), account, weth, msg.value, _minUsdg, _minGsp);

        IRewardTracker(feeGspTracker).stakeForAccount(account, account, gsp, gspAmount);
        IRewardTracker(stakedGspTracker).stakeForAccount(account, account, feeGspTracker, gspAmount);

        emit StakeGsp(account, gspAmount);

        return gspAmount;
    }

    function unstakeAndRedeemGsp(address _tokenOut, uint256 _gspAmount, uint256 _minOut, address _receiver) external nonReentrant returns (uint256) {
        require(_gspAmount > 0, "RewardRouter: invalid _gspAmount");

        address account = msg.sender;
        IRewardTracker(stakedGspTracker).unstakeForAccount(account, feeGspTracker, _gspAmount, account);
        IRewardTracker(feeGspTracker).unstakeForAccount(account, gsp, _gspAmount, account);
        uint256 amountOut = IGspManager(gspManager).removeLiquidityForAccount(account, _tokenOut, _gspAmount, _minOut, _receiver);

        emit UnstakeGsp(account, _gspAmount);

        return amountOut;
    }

    function unstakeAndRedeemGspETH(uint256 _gspAmount, uint256 _minOut, address payable _receiver) external nonReentrant returns (uint256) {
        require(_gspAmount > 0, "RewardRouter: invalid _gspAmount");

        address account = msg.sender;
        IRewardTracker(stakedGspTracker).unstakeForAccount(account, feeGspTracker, _gspAmount, account);
        IRewardTracker(feeGspTracker).unstakeForAccount(account, gsp, _gspAmount, account);
        uint256 amountOut = IGspManager(gspManager).removeLiquidityForAccount(account, weth, _gspAmount, _minOut, address(this));

        IWETH(weth).withdraw(amountOut);

        _receiver.sendValue(amountOut);

        emit UnstakeGsp(account, _gspAmount);

        return amountOut;
    }

    function claim() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(feeGspTracker).claimForAccount(account, account);

        IRewardTracker(stakedGspTracker).claimForAccount(account, account);
    }

    function claimEsGsx() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(stakedGspTracker).claimForAccount(account, account);
    }

    function claimFees() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(feeGspTracker).claimForAccount(account, account);
    }


    function handleRewards(
        bool _shouldClaimGsx,
        bool _shouldClaimEsGsx,
        bool _shouldClaimWeth,
        bool _shouldConvertWethToEth
    ) external nonReentrant {
        address account = msg.sender;

        if (_shouldClaimGsx) {
            IVester(gspVester).claimForAccount(account, account);
        }


        if (_shouldClaimEsGsx) {
            IRewardTracker(stakedGspTracker).claimForAccount(account, account);
        }


        if (_shouldClaimWeth) {
            if (_shouldConvertWethToEth) {
                uint256 wethAmount = IRewardTracker(feeGspTracker).claimForAccount(account, address(this));

                IWETH(weth).withdraw(wethAmount);

                payable(account).sendValue(wethAmount);
            } else {
                IRewardTracker(feeGspTracker).claimForAccount(account, account);
            }
        }
    }


    // the _validateReceiver function checks that the averageStakedAmounts and cumulativeRewards
    // values of an account are zero, this is to help ensure that vesting calculations can be
    // done correctly
    // averageStakedAmounts and cumulativeRewards are updated if the claimable reward for an account
    // is more than zero
    // it is possible for multiple transfers to be sent into a single account, using signalTransfer and
    // acceptTransfer, if those values have not been updated yet
    // for GSP transfers it is also possible to transfer GSP into an account using the StakedGsp contract
    function signalTransfer(address _receiver) external nonReentrant {
        require(IERC20(gspVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");

        _validateReceiver(_receiver);
        pendingReceivers[msg.sender] = _receiver;
    }

    function acceptTransfer(address _sender) external nonReentrant {
        require(IERC20(gspVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");

        address receiver = msg.sender;
        require(pendingReceivers[_sender] == receiver, "RewardRouter: transfer not signalled");
        delete pendingReceivers[_sender];

        _validateReceiver(receiver);

        uint256 esGsxBalance = IERC20(esGsx).balanceOf(_sender);
        if (esGsxBalance > 0) {
            IERC20(esGsx).transferFrom(_sender, receiver, esGsxBalance);
        }

        uint256 gspAmount = IRewardTracker(feeGspTracker).depositBalances(_sender, gsp);
        if (gspAmount > 0) {
            IRewardTracker(stakedGspTracker).unstakeForAccount(_sender, feeGspTracker, gspAmount, _sender);
            IRewardTracker(feeGspTracker).unstakeForAccount(_sender, gsp, gspAmount, _sender);

            IRewardTracker(feeGspTracker).stakeForAccount(_sender, receiver, gsp, gspAmount);
            IRewardTracker(stakedGspTracker).stakeForAccount(receiver, receiver, feeGspTracker, gspAmount);
        }

        IVester(gspVester).transferStakeValues(_sender, receiver);
    }

    function _validateReceiver(address _receiver) private view {

 
        require(IRewardTracker(stakedGspTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedGspTracker.averageStakedAmounts > 0");
        require(IRewardTracker(stakedGspTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedGspTracker.cumulativeRewards > 0");

        require(IRewardTracker(feeGspTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeGspTracker.averageStakedAmounts > 0");
        require(IRewardTracker(feeGspTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeGspTracker.cumulativeRewards > 0");

        require(IVester(gspVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: gspVester.transferredAverageStakedAmounts > 0");
        require(IVester(gspVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: gspVester.transferredCumulativeRewards > 0");

        require(IERC20(gspVester).balanceOf(_receiver) == 0, "RewardRouter: gspVester.balance > 0");
    }

}
