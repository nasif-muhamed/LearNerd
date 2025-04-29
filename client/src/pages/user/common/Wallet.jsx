import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, Wallet, CreditCard, Filter, ChevronDown, Info, DollarSign } from 'lucide-react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import handleError from '../../../utils/handleError';
import api from '../../../services/api/axiosInterceptor';
// Mock data - Replace with your API calls
const mockWalletData = {
  balance: 3450.75,
  pendingBalance: 750.25,
  transactions: [
    {
      id: 1,
      type: 'course_sale',
      amount: 495.00,
      courseName: 'Advanced React Development',
      status: 'pending',
      date: new Date(2025, 3, 25),
      buyer: 'John Doe',
      description: 'Course purchase by John Doe',
      maturityDate: new Date(2025, 4, 25),
    },
    {
      id: 2,
      type: 'course_purchase',
      amount: -129.99,
      courseName: 'Django for Beginners',
      status: 'completed',
      date: new Date(2025, 3, 22),
      seller: 'Jane Smith',
      description: 'Purchase of "Django for Beginners"',
    },
    {
      id: 3,
      type: 'admin_payout',
      amount: 2340.50,
      status: 'completed',
      date: new Date(2025, 3, 15),
      description: 'Monthly payout - March 2025',
      details: 'Matured course sales + ad revenue share',
    },
    {
      id: 4,
      type: 'commission',
      amount: -45.50,
      status: 'completed',
      date: new Date(2025, 3, 15),
      description: 'Platform commission on sales',
    },
    {
      id: 5,
      type: 'refund',
      amount: -199.99,
      courseName: 'UX Design Masterclass',
      status: 'completed',
      date: new Date(2025, 3, 10),
      buyer: 'Alice Johnson',
      description: 'Refund issued for UX Design Masterclass',
      reason: 'Course content did not match description',
    },
    {
      id: 6,
      type: 'withdrawal',
      amount: -1000.00,
      status: 'completed',
      date: new Date(2025, 3, 5),
      description: 'Withdrawal to bank account ****4567',
      transferId: 'TRF-2025040501',
    },
    {
      id: 7,
      type: 'course_sale',
      amount: 199.99,
      courseName: 'Python Data Science',
      status: 'completed',
      date: new Date(2025, 2, 28),
      buyer: 'Robert Wilson',
      description: 'Course purchase by Robert Wilson',
    }
  ]
};

// Transaction status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-600/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-600/30';
      case 'failed':
        return 'bg-destructive/20 text-destructive border border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'failed':
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return <AlertCircle className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <span className={`inline-flex items-center text-xs px-2 py-1 rounded-md ${getStatusStyles()}`}>
      {getStatusIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Transaction type badge component
const TypeBadge = ({ type }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'course_sale':
        return 'bg-primary/20 text-primary border border-primary/30';
      case 'course_purchase':
        return 'bg-accent/20 text-accent border border-accent/30';
      case 'admin_payout':
        return 'bg-blue-500/20 text-blue-400 border border-blue-600/30';
      case 'commission':
        return 'bg-purple-500/20 text-purple-400 border border-purple-600/30';
      case 'refund':
        return 'bg-orange-500/20 text-orange-400 border border-orange-600/30';
      case 'withdrawal':
        return 'bg-teal-500/20 text-teal-400 border border-teal-600/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'course_sale':
        return <ArrowUpRight className="w-3 h-3 mr-1" />;
      case 'course_purchase':
        return <ArrowDownLeft className="w-3 h-3 mr-1" />;
      case 'admin_payout':
        return <DollarSign className="w-3 h-3 mr-1" />;
      case 'commission':
        return <ArrowDownLeft className="w-3 h-3 mr-1" />;
      case 'refund':
        return <ArrowDownLeft className="w-3 h-3 mr-1" />;
      case 'withdrawal':
        return <CreditCard className="w-3 h-3 mr-1" />;
      default:
        return <Info className="w-3 h-3 mr-1" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'course_sale':
        return 'Course Sale';
      case 'course_purchase':
        return 'Course Purchase';
      case 'admin_payout':
        return 'Admin Payout';
      case 'commission':
        return 'Commission';
      case 'refund':
        return 'Refund';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return type;
    }
  };

  return (
    <span className={`inline-flex items-center text-xs px-2 py-1 rounded-md ${getTypeStyles()}`}>
      {getTypeIcon()}
      {getTypeLabel()}
    </span>
  );
};

// Transaction card component
const TransactionCard = ({ transaction }) => {
  const [expanded, setExpanded] = useState(false);

  const getAmountColor = () => {
    if (transaction.amount > 0) return 'text-green-400';
    return 'text-destructive';
  };

  const getTitleByType = () => {
    switch (transaction.transaction_type) {
      case 'course_sale':
        return `Sale: ${transaction.course_name}`;
      case 'course_purchase':
        return `Purchase: ${transaction.course_name}`;
      case 'admin_payout':
        return 'Admin Payout';
      case 'commission':
        return 'Platform Commission';
      case 'refund':
        return `Refund: ${transaction.courseName}`;
      case 'withdrawal':
        return 'Withdrawal to Bank';
      default:
        return 'Transaction';
    }
  };

  const formatDate = (date) => {
    if (!date) return
    const parsedDate = new Date(date); 
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return parsedDate.toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-card border border-border p-4 rounded-lg mb-4 transition-all duration-300 hover:border-muted">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-shrink-0">
            {transaction.amount > 0 ? (
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-destructive" />
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium">{getTitleByType()}</h3>
            <p className="text-sm text-muted-foreground">{transaction.description}</p>
          </div>
        </div>
        
        <div className="mt-2 md:mt-0 flex flex-col items-end">
          <span className={`font-semibold text-lg ${getAmountColor()}`}>
            {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</span>
        </div>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={transaction.status} />
        <TypeBadge type={transaction.transaction_type} />
        
        {transaction.status === 'pending' && transaction.mature_date && (
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Matures on {formatDate(transaction.mature_date)}
          </span>
        )}
      </div>

      {transaction.transaction_type === 'course_sale' && transaction.status === 'pending' && (
        <div className="mt-3 text-xs text-muted-foreground flex items-center">
          <Info className="w-3 h-3 mr-1" />
          Funds will be available after the safety period ends
        </div>
      )}
      
      {/* {expanded && (
        <div className="mt-4 pt-3 border-t border-border text-sm space-y-2">
          {transaction.buyer && (
            <p className="text-muted-foreground">Buyer: <span className="text-foreground">{transaction.buyer}</span></p>
          )}
          {transaction.seller && (
            <p className="text-muted-foreground">Seller: <span className="text-foreground">{transaction.seller}</span></p>
          )}
          {transaction.transferId && (
            <p className="text-muted-foreground">Transfer ID: <span className="text-foreground">{transaction.transferId}</span></p>
          )}
          {transaction.reason && (
            <p className="text-muted-foreground">Reason: <span className="text-foreground">{transaction.reason}</span></p>
          )}
          {transaction.details && (
            <p className="text-muted-foreground">Details: <span className="text-foreground">{transaction.details}</span></p>
          )}
        </div>
      )}
      
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center transition-colors duration-300"
      >
        {expanded ? 'Show less' : 'Show details'}
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${expanded ? 'transform rotate-180' : ''}`} />
      </button> */}
    </div>
  );
};

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchTransactions = async () => {
    try{
      setIsLoading(true)
      const response = await api.get(`transactions/`, {params: {}})
      setWallet(response.data)
      console.log('response featch transactions:', response)
    }catch (error) {
        console.log('error fetching transactions:', error)
        handleError(error, 'Error fetching transactions')
    }finally{
        setIsLoading(false)
    }
  }

  useEffect(() => {
    // In real implementation, fetch data from your API
    fetchTransactions()
  }, []);

  const handleWithdraw = (e) => {
    e.preventDefault();
    // Simulating API call for withdrawal
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setShowWithdrawModal(false);
      // Add new withdrawal transaction to the list
      const newTransaction = {
        id: Date.now(),
        type: 'withdrawal',
        amount: -parseFloat(withdrawAmount),
        status: 'pending',
        date: new Date(),
        description: 'Withdrawal to bank account (processing)',
      };
      setWallet(prev => ({
        ...prev,
        balance: prev.balance - parseFloat(withdrawAmount),
        transactions: [newTransaction, ...prev.transactions]
      }));
      setWithdrawAmount('');
    }, 1500);
  };

  const filteredTransactions = wallet?.transactions.filter(transaction => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return transaction.status === 'pending';
    if (activeFilter === 'completed') return transaction.status === 'completed';
    if (activeFilter === 'income') return transaction.amount > 0;
    if (activeFilter === 'expense') return transaction.amount < 0;
    return transaction.transaction_type === activeFilter;
  });

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner/>      
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Your Wallet</h1>
        <button 
          onClick={() => setShowWithdrawModal(true)}
          className="btn-primary flex items-center"
          disabled={wallet?.balance <= 0}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Withdraw Funds
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-effect rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Wallet className="w-5 h-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold">Available Balance</h2>
          </div>
          <p className="text-3xl font-bold">₹{wallet?.balance.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Funds that can be withdrawn to your bank account
          </p>
        </div>

        <div className="glass-effect rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-yellow-400 mr-2" />
            <h2 className="text-lg font-semibold">Pending Balance</h2>
          </div>
          <p className="text-3xl font-bold text-yellow-400">₹{wallet?.pendingBalance.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Funds that will be available after safety periods end
          </p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Filter:</span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveFilter('pending')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'pending' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveFilter('completed')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'completed' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Completed
          </button>
          <button 
            onClick={() => setActiveFilter('income')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'income' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Income
          </button>
          <button 
            onClick={() => setActiveFilter('expense')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'expense' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Expense
          </button>
          <button 
            onClick={() => setActiveFilter('course_sale')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'course_sale' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Course Sales
          </button>
          <button 
            onClick={() => setActiveFilter('course_purchase')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'course_purchase' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Purchases
          </button>
        </div>

        {/* Transaction List */}
        <div>
          {filteredTransactions && filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">Available Balance</label>
                <p className="text-2xl font-bold">₹{wallet?.balance.toFixed(2)}</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm text-muted-foreground mb-2">Withdrawal Amount</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={wallet?.balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-background border border-input w-full py-2 px-8 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > wallet?.balance}
                >
                  {isWithdrawing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-white/0 rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Withdraw Funds'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;