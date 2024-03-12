// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";
import "../libraries/token/SafeERC20.sol";
import "../libraries/utils/ReentrancyGuard.sol";

import "./interfaces/IRewardTracker.sol";
import "./interfaces/IVester.sol";
import "../tokens/interfaces/IMintable.sol";
import "../access/Governable.sol";

contract Vester is IVester, IERC20, ReentrancyGuard, Governable {
    // 使用 SafeMath 库来进行安全的数学运算，避免溢出和下溢
    // 使用 SafeERC20 库来安全处理 ERC20 操作，避免潜在的攻击
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ERC20 代币的名称、符号和小数位数
    string public name;
    string public symbol;
    uint8 public decimals = 18;

    // 投资解锁的持续时间
    uint256 public vestingDuration;

    // ES 代币、交易对代币和可领取代币的地址
    address public esToken;
    address public pairToken;
    address public claimableToken;

    // 奖励跟踪器的地址
    address public override rewardTracker;

    // 代币的总供应量和交易对代币的供应量
    uint256 public override totalSupply;
    uint256 public pairSupply;

    // 是否设置了最大可投资金额
    bool public hasMaxVestableAmount;

    // 用户余额、交易对代币数量、累积领取金额、已领取金额和上次领取时间的映射
    mapping (address => uint256) public balances;
    mapping (address => uint256) public override pairAmounts;
    mapping (address => uint256) public override cumulativeClaimAmounts;
    mapping (address => uint256) public override claimedAmounts;
    mapping (address => uint256) public lastVestingTimes;

    // 转移平均抵押金额、累积奖励、累积奖励扣除和额外奖励的映射
    mapping (address => uint256) public override transferredAverageStakedAmounts;
    mapping (address => uint256) public override transferredCumulativeRewards;
    mapping (address => uint256) public override cumulativeRewardDeductions;
    mapping (address => uint256) public override bonusRewards;

    // 标识是否是处理器的映射
    mapping (address => bool) public isHandler;

    // 声明事件，用于记录领取、存款、提取和交易对代币转移等操作
    event Claim(address receiver, uint256 amount);
    event Deposit(address account, uint256 amount);
    event Withdraw(address account, uint256 claimedAmount, uint256 balance);
    event PairTransfer(address indexed from, address indexed to, uint256 value);


   // 合约构造函数，用于初始化合约的基本信息
    constructor (
        string memory _name,
        string memory _symbol,
        uint256 _vestingDuration,
        address _esToken,
        address _pairToken,
        address _claimableToken,
        address _rewardTracker
    ) public {
        // 设置 ERC20 代币的名称、符号和投资解锁的持续时间
        name = _name;
        symbol = _symbol;
        vestingDuration = _vestingDuration;

        // 设置 ES 代币、交易对代币和可领取代币的地址
        esToken = _esToken;
        pairToken = _pairToken;
        claimableToken = _claimableToken;

        // 设置奖励跟踪器的地址
        rewardTracker = _rewardTracker;

        // 如果奖励跟踪器地址不为零，则设置最大可投资金额标志为 true
        if (rewardTracker != address(0)) {
            hasMaxVestableAmount = true;
        }
    }

    // 设置处理器的函数，只有治理地址可以调用
    function setHandler(address _handler, bool _isActive) external onlyGov {
        // 设置指定处理器的激活状态
        isHandler[_handler] = _isActive;
    }

    // 设置是否有最大可投资金额的函数，只有治理地址可以调用
    function setHasMaxVestableAmount(bool _hasMaxVestableAmount) external onlyGov {
        // 设置是否有最大可投资金额的标志
        hasMaxVestableAmount = _hasMaxVestableAmount;
    }

    // 存款函数，允许用户存款
    function deposit(uint256 _amount) external nonReentrant {
        // 调用内部函数进行存款
        _deposit(msg.sender, _amount);
    }

    // 为指定账户进行存款的函数，需要通过处理器进行验证
    function depositForAccount(address _account, uint256 _amount) external nonReentrant {
        // 验证调用者是否为处理器
        _validateHandler();
        // 调用内部函数进行为指定账户存款
        _deposit(_account, _amount);
    }

    // 领取奖励函数，允许用户领取奖励
    function claim() external nonReentrant returns (uint256) {
        // 调用内部函数进行领取奖励
        return _claim(msg.sender, msg.sender);
    }

    // 为指定账户领取奖励的函数，需要通过处理器进行验证
    function claimForAccount(address _account, address _receiver) external override nonReentrant returns (uint256) {
        // 验证调用者是否为处理器
        _validateHandler();
        // 调用内部函数进行为指定账户领取奖励
        return _claim(_account, _receiver);
    }


    // to help users who accidentally send their tokens to this contract
    function withdrawToken(address _token, address _account, uint256 _amount) external onlyGov {
        IERC20(_token).safeTransfer(_account, _amount);
    }

    // 提现函数，允许用户提现已投资的金额
    function withdraw() external nonReentrant {
        // 获取用户地址
        address account = msg.sender;

        // 设置接收地址为用户地址
        address _receiver = account;

        // 调用 _claim 函数，领取用户的奖励
        _claim(account, _receiver);

        // 获取用户已领取的金额、余额和总投资额
        uint256 claimedAmount = cumulativeClaimAmounts[account];
        uint256 balance = balances[account];
        uint256 totalVested = balance.add(claimedAmount);

        // 确保总投资额大于零，否则抛出错误
        require(totalVested > 0, "Vester: vested amount is zero");

        // 如果存在交易对代币
        if (hasPairToken()) {
            // 获取用户的交易对代币数量
            uint256 pairAmount = pairAmounts[account];
            
            // 调用 _burnPair 函数，销毁用户的交易对代币
            _burnPair(account, pairAmount);
            
            // 使用 SafeERC20 的 safeTransfer 函数将交易对代币转账给接收地址
            IERC20(pairToken).safeTransfer(_receiver, pairAmount);
        }

        // 使用 SafeERC20 的 safeTransfer 函数将 ES 代币的余额转账给接收地址
        IERC20(esToken).safeTransfer(_receiver, balance);

        // 调用 _burn 函数，销毁用户的 ES 代币余额
        _burn(account, balance);

        // 清空用户的累积领取总额、已领取总额和上次领取时间
        delete cumulativeClaimAmounts[account];
        delete claimedAmounts[account];
        delete lastVestingTimes[account];

        // 发出提现事件
        emit Withdraw(account, claimedAmount, balance);
    }


    // 转移抵押数值的函数，用于处理抵押数值在两个账户之间的转移
    function transferStakeValues(address _sender, address _receiver) external override nonReentrant {
        // 验证调用者是否为处理器
        _validateHandler();

        // 设置接收账户的平均抵押数值为发送账户的综合平均抵押数值
        transferredAverageStakedAmounts[_receiver] = getCombinedAverageStakedAmount(_sender);
        
        // 将发送账户的平均抵押数值设为零
        transferredAverageStakedAmounts[_sender] = 0;

        // 获取发送账户的累积奖励和当前奖励跟踪器中的累积奖励
        uint256 transferredCumulativeReward = transferredCumulativeRewards[_sender];
        uint256 cumulativeReward = IRewardTracker(rewardTracker).cumulativeRewards(_sender);

        // 将发送账户的累积奖励转移到接收账户，并记录奖励的扣除数值
        transferredCumulativeRewards[_receiver] = transferredCumulativeReward.add(cumulativeReward);
        cumulativeRewardDeductions[_sender] = cumulativeReward;
        
        // 将发送账户的累积奖励设为零
        transferredCumulativeRewards[_sender] = 0;

        // 转移发送账户的额外奖励到接收账户
        bonusRewards[_receiver] = bonusRewards[_sender];
        bonusRewards[_sender] = 0;
    }


    function setTransferredAverageStakedAmounts(address _account, uint256 _amount) external override nonReentrant {
        _validateHandler();
        transferredAverageStakedAmounts[_account] = _amount;
    }

    function setTransferredCumulativeRewards(address _account, uint256 _amount) external override nonReentrant {
        _validateHandler();
        transferredCumulativeRewards[_account] = _amount;
    }

    function setCumulativeRewardDeductions(address _account, uint256 _amount) external override nonReentrant {
        _validateHandler();
        cumulativeRewardDeductions[_account] = _amount;
    }

    function setBonusRewards(address _account, uint256 _amount) external override nonReentrant {
        _validateHandler();
        bonusRewards[_account] = _amount;
    }

    function claimable(address _account) public override view returns (uint256) {
        // 计算尚未领取的总金额，即累积领取金额减去已领取金额
        uint256 amount = cumulativeClaimAmounts[_account].sub(claimedAmounts[_account]);

        // 获取用户下一次可以领取的金额
        uint256 nextClaimable = _getNextClaimableAmount(_account);

        // 返回总的可领取金额，包括尚未领取的和下一次可以领取的
        return amount.add(nextClaimable);
    }


    function getMaxVestableAmount(address _account) public override view returns (uint256) {
        if (!hasRewardTracker()) { return 0; }

        uint256 transferredCumulativeReward = transferredCumulativeRewards[_account];
        uint256 bonusReward = bonusRewards[_account];
        uint256 cumulativeReward = IRewardTracker(rewardTracker).cumulativeRewards(_account);
        uint256 maxVestableAmount = cumulativeReward.add(transferredCumulativeReward).add(bonusReward);

        uint256 cumulativeRewardDeduction = cumulativeRewardDeductions[_account];

        if (maxVestableAmount < cumulativeRewardDeduction) {
            return 0;
        }

        return maxVestableAmount.sub(cumulativeRewardDeduction);
    }

    // 获取用户的综合平均抵押数值的函数
    function getCombinedAverageStakedAmount(address _account) public override view returns (uint256) {
        // 获取用户当前奖励跟踪器中的累积奖励
        uint256 cumulativeReward = IRewardTracker(rewardTracker).cumulativeRewards(_account);

        // 获取用户已转移的累积奖励
        uint256 transferredCumulativeReward = transferredCumulativeRewards[_account];

        // 计算用户总的累积奖励
        uint256 totalCumulativeReward = cumulativeReward.add(transferredCumulativeReward);

        // 如果总的累积奖励为零，返回零
        if (totalCumulativeReward == 0) { return 0; }

        // 获取用户当前奖励跟踪器中的平均抵押数值
        uint256 averageStakedAmount = IRewardTracker(rewardTracker).averageStakedAmounts(_account);

        // 获取用户已转移的平均抵押数值
        uint256 transferredAverageStakedAmount = transferredAverageStakedAmounts[_account];

        // 使用加权平均的方式计算综合平均抵押数值
        return averageStakedAmount
            .mul(cumulativeReward)
            .div(totalCumulativeReward)
            .add(
                transferredAverageStakedAmount.mul(transferredCumulativeReward).div(totalCumulativeReward)
            );
    }


    // 获取用户抵押后的交易对代币数量的函数
    function getPairAmount(address _account, uint256 _esAmount) public view returns (uint256) {
        // 如果不存在奖励跟踪器，返回零
        if (!hasRewardTracker()) { return 0; }

        // 获取用户的综合平均抵押数值
        uint256 combinedAverageStakedAmount = getCombinedAverageStakedAmount(_account);

        // 如果综合平均抵押数值为零，返回零
        if (combinedAverageStakedAmount == 0) {
            return 0;
        }

        // 获取用户的最大可投资金额
        uint256 maxVestableAmount = getMaxVestableAmount(_account);

        // 如果最大可投资金额为零，返回零
        if (maxVestableAmount == 0) {
            return 0;
        }

        // 计算并返回用户抵押后的交易对代币数量
        return _esAmount.mul(combinedAverageStakedAmount).div(maxVestableAmount);
    }


    function hasRewardTracker() public view returns (bool) {
        return rewardTracker != address(0);
    }

    function hasPairToken() public view returns (bool) {
        return pairToken != address(0);
    }

    function getTotalVested(address _account) public view returns (uint256) {
        return balances[_account].add(cumulativeClaimAmounts[_account]);
    }

    function balanceOf(address _account) public view override returns (uint256) {
        return balances[_account];
    }

    // empty implementation, tokens are non-transferrable
    function transfer(address /* recipient */, uint256 /* amount */) public override returns (bool) {
        revert("Vester: non-transferrable");
    }

    // empty implementation, tokens are non-transferrable
    function allowance(address /* owner */, address /* spender */) public view virtual override returns (uint256) {
        return 0;
    }

    // empty implementation, tokens are non-transferrable
    function approve(address /* spender */, uint256 /* amount */) public virtual override returns (bool) {
        revert("Vester: non-transferrable");
    }

    // empty implementation, tokens are non-transferrable
    function transferFrom(address /* sender */, address /* recipient */, uint256 /* amount */) public virtual override returns (bool) {
        revert("Vester: non-transferrable");
    }

    function getVestedAmount(address _account) public override view returns (uint256) {
        uint256 balance = balances[_account];
        uint256 cumulativeClaimAmount = cumulativeClaimAmounts[_account];
        return balance.add(cumulativeClaimAmount);
    }

    function _mint(address _account, uint256 _amount) private {
        require(_account != address(0), "Vester: mint to the zero address");

        totalSupply = totalSupply.add(_amount);
        balances[_account] = balances[_account].add(_amount);

        emit Transfer(address(0), _account, _amount);
    }

    function _mintPair(address _account, uint256 _amount) private {
        require(_account != address(0), "Vester: mint to the zero address");

        pairSupply = pairSupply.add(_amount);
        pairAmounts[_account] = pairAmounts[_account].add(_amount);

        emit PairTransfer(address(0), _account, _amount);
    }

    function _burn(address _account, uint256 _amount) private {
        require(_account != address(0), "Vester: burn from the zero address");

        balances[_account] = balances[_account].sub(_amount, "Vester: burn amount exceeds balance");
        totalSupply = totalSupply.sub(_amount);

        emit Transfer(_account, address(0), _amount);
    }

    function _burnPair(address _account, uint256 _amount) private {
        require(_account != address(0), "Vester: burn from the zero address");

        pairAmounts[_account] = pairAmounts[_account].sub(_amount, "Vester: burn amount exceeds balance");
        pairSupply = pairSupply.sub(_amount);

        emit PairTransfer(_account, address(0), _amount);
    }

    // 内部函数，用于处理用户的存款操作
    function _deposit(address _account, uint256 _amount) private {
        // 确保存款金额大于零
        require(_amount > 0, "Vester: invalid _amount");

        // 更新用户的投资信息
        _updateVesting(_account);

        // 使用 SafeERC20 的 safeTransferFrom 函数将 ES 代币从用户账户转移到合约账户
        IERC20(esToken).safeTransferFrom(_account, address(this), _amount);

        // 调用 _mint 函数，增发用户对应的 ES 代币数量
        _mint(_account, _amount);

        // 如果存在交易对代币
        if (hasPairToken()) {
            // 获取用户的交易对代币数量
            uint256 pairAmount = pairAmounts[_account];

            // 获取用户下一次抵押后的交易对代币数量
            uint256 nextPairAmount = getPairAmount(_account, balances[_account]);

            // 如果下一次抵押后的交易对代币数量大于当前数量
            if (nextPairAmount > pairAmount) {
                // 计算差额并将多余的交易对代币转移到合约账户
                uint256 pairAmountDiff = nextPairAmount.sub(pairAmount);
                IERC20(pairToken).safeTransferFrom(_account, address(this), pairAmountDiff);
                
                // 调用 _mintPair 函数，增发用户的交易对代币数量
                _mintPair(_account, pairAmountDiff);
            }
        }

        // 如果设置了最大可投资金额
        if (hasMaxVestableAmount) {
            // 获取用户的最大可投资金额
            uint256 maxAmount = getMaxVestableAmount(_account);
            
            // 确保用户的总投资额不超过最大可投资金额
            require(getTotalVested(_account) <= maxAmount, "Vester: max vestable amount exceeded");
        }

        // 发出存款事件
        emit Deposit(_account, _amount);
    }


    // 内部函数，用于更新用户的投资信息
    function _updateVesting(address _account) private {
        // 获取用户下一次可以领取的金额
        uint256 amount = _getNextClaimableAmount(_account);

        // 更新用户上次领取时间为当前区块的时间戳
        lastVestingTimes[_account] = block.timestamp;

        // 如果下一次可领取的金额为零，则直接返回，无需进行后续操作
        if (amount == 0) {
            return;
        }

        // 从用户余额中销毁（burn）领取的金额
        _burn(_account, amount);

        // 将领取的金额累加到用户的累积领取总额中
        cumulativeClaimAmounts[_account] = cumulativeClaimAmounts[_account].add(amount);

        // 调用 ES 代币的 burn 函数，将领取的金额销毁
        IMintable(esToken).burn(address(this), amount);
    }


    function _getNextClaimableAmount(address _account) private view returns (uint256) {
        // 计算当前时间与上次领取时间的时间差
        uint256 timeDiff = block.timestamp.sub(lastVestingTimes[_account]);

        // 获取用户的余额
        uint256 balance = balances[_account];

        // 如果用户余额为零，则返回 0（没有可领取的金额）
        if (balance == 0) {
            return 0;
        }

        // 获取用户已投资的金额
        uint256 vestedAmount = getVestedAmount(_account);

        // 计算可以领取的金额，根据已投资金额、时间差和投资解锁的持续时间来计算
        uint256 claimableAmount = vestedAmount.mul(timeDiff).div(vestingDuration);

        // 如果可领取金额小于用户余额，则返回可领取金额；否则，返回用户余额
        if (claimableAmount < balance) {
            return claimableAmount;
        }

        return balance;
    }

    // 内部函数，用于执行用户的领取奖励操作
    function _claim(address _account, address _receiver) private returns (uint256) {
        // 更新用户的投资信息
        _updateVesting(_account);

        // 计算用户当前可领取的总金额
        uint256 amount = claimable(_account);

        // 将领取的金额加到已领取的总额中
        claimedAmounts[_account] = claimedAmounts[_account].add(amount);

        // 使用 SafeERC20 的 safeTransfer 函数将领取的金额转账给指定的接收地址
        IERC20(claimableToken).safeTransfer(_receiver, amount);

        // 发出领取奖励的事件
        emit Claim(_account, amount);

        // 返回领取的金额
        return amount;
    }

    function _validateHandler() private view {
        require(isHandler[msg.sender], "Vester: forbidden");
    }
}
