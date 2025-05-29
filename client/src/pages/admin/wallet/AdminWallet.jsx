import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle, Wallet, CreditCard, Loader, Info, DollarSign, RefreshCcw, HandCoins, Handshake } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import handleError from '../../../utils/handleError';
import api from '../../../services/api/axiosInterceptor';
import Pagination from '../../../components/ui/Pagination'
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

const TransactionCard = ({ transaction }) => {
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
      
    </div>
  );
};

const WalletPage = () => {
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    // const [activeFilter, setActiveFilter] = useState('all');
    const [filter, setFilter] = useState('all');
    // const [withdrawAmount, setWithdrawAmount] = useState('');
    // const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    // const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const pageSize = 9;
    const totalPages = Math.ceil(totalCount / pageSize);
    const [mainData, setMainData] = useState([
        { name: 'Commission', value: 0 },
        { name: 'Distributed', value: 0 },
        { name: 'On Hold', value: 0 },
        { name: 'Refunded', value: 0 },
    ])
    const COLORS = ['#22c35d', '#facc15', '#6b7280', '#dc6565'];

    const fetchAdminTransactions = useCallback(async () => {
        try{
            console.log('filter inside fetch:', filter)
            const params = {
                page: currentPage,
                page_size: pageSize,
                filter: filter,
            }

            setIsLoading(true)
            const response = await api.get(`admin/transactions/`, {
                params: params
            });
            const data = response.data;
            setWallet(data)
            setTotalCount(data.count);
            setNextPage(data.next);
            setPrevPage(data.previous);
            setMainData([
                { name: 'Commission', value: data.total_commission || 0 },
                { name: 'Distributed', value: data.total_payouts || 0 },
                { name: 'On Hold', value: data.pending_total || 0 },
                { name: 'Refunded', value: data.total_refunds || 0 },
            ])

            console.log('response featch transactions:', response)
        }catch (error) {
            console.log('error fetching transactions:', error)
            handleError(error, 'Error fetching transactions')
        }finally{
            setIsLoading(false)
        }
    }, [currentPage, filter]);

    useEffect(() => {
        fetchAdminTransactions()
    }, [fetchAdminTransactions]);

    const handleChange = (event) => {
        console.log('event:', event.target.value, event)
        setFilter(event.target.value);
    };

    const options = ['all', 'month', 'week', 'today'];
    const options_map ={'all': 'All', 'month': 'This Month', 'week': 'This Week', 'today': 'Today'};

    const downloadPDF = async () => {
        try{
            console.log('filter inside pdf download:', filter)
            const params = {
                filter: filter,
            }
            setDownloadLoading(true)
            const response = await api.get(`transactions/admin/pdf/`, {
                params: params,
                responseType: 'blob'
            });
            console.log('after response pdf:', response)
            // for downloading directly
            // const url = window.URL.createObjectURL(new Blob([response.data]));
            // const link = document.createElement('a');
            // link.href = url;
            // link.setAttribute('download', 'transaction_report.pdf');
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);
            // window.URL.revokeObjectURL(url);
            // console.log('response featch transactions:', response)

            // for opeing in new tab
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const newTab = window.open(url, '_blank');
            if (newTab) {
                newTab.focus();
            }
            window.URL.revokeObjectURL(url); // Clean up the URL object
            // Or we can do like below
            // Open the PDF in a new tab 
            // window.open(url, '_blank');
            // window.URL.revokeObjectURL(url);
        }catch (error) {
            console.log('error fetching transactions:', error)
            handleError(error, 'Error fetching transactions')
        }finally{
            setDownloadLoading(false)
        }
    }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
        {isLoading && <LoadingSpinner/>}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Sales Report - Transactions</h1>
            <div className="flex justify-end mb-6">
                <select
                    value={filter}
                    onChange={handleChange}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 hover:bg-gray-600 transition-colors"
                >
                    {options.map((option) => (
                        <option key={option} value={option} className="bg-gray-700 text-white">
                            {options_map[option]}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Balance Cards */}
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 h-80">
                <div className="glass-effect rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Wallet className="w-5 h-5 text-primary mr-2" />
                        <h2 className="text-lg font-semibold">Total Revenue</h2>
                    </div>
                    <p className="text-3xl text-primary font-bold">₹{wallet?.total_revenue?.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Funds that users spent on courses
                    </p>
                </div>

                <div className="glass-effect rounded-lg p-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={mainData}
                                cx="50%"
                                cy="50%"
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={500}
                                animationBegin={0}
                                animationEasing="ease-out"
                                stroke="#52a8ff"
                            >
                            {mainData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}`} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-effect rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Handshake className="w-5 h-5 text-success mr-2" />
                        <h2 className="text-lg font-semibold">Commision</h2>
                    </div>
                    <p className="text-3xl text-success font-bold">₹{wallet?.total_commission?.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Deducted Commision from course sales
                    </p>
                </div>

                <div className="glass-effect rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <HandCoins className="w-5 h-5 text-yellow-400 mr-2" />
                        <h2 className="text-lg font-semibold">Distributed</h2>
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">₹{wallet?.total_payouts?.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Funds distributed to users for course sales
                    </p>
                </div>

                <div className="glass-effect rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Clock className="w-5 h-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-semibold">On Hold</h2>
                    </div>
                    <p className="text-3xl font-bold text-gray-500">₹{wallet?.pending_total?.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Funds will pay out after safety periods end
                    </p>
                </div>

                <div className="glass-effect rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <RefreshCcw className="w-5 h-5 text-destructive mr-2" />
                        <h2 className="text-lg font-semibold">Refunds</h2>
                    </div>
                    <p className="text-3xl font-bold text-destructive">₹{wallet?.total_refunds?.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Funds that are refunded to users
                    </p>
                </div>

            </div>
        </div>

        {/* Transactions Section */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Transaction History</h2>
                <button
                    onClick={downloadPDF}
                    className={`mb-4 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${downloadLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={downloadLoading}
                >
                    {downloadLoading && <Loader className="w-6 h-6 animate-spin text-white" />} Download PDF
                </button>
            </div>

            {/* Transaction List */}
            <div>
                {wallet?.results && wallet?.results?.length > 0 ? (
                    wallet?.results.map((transaction) => (
                        <TransactionCard key={transaction.id} transaction={transaction} />
                    ))
                ) : (
                    <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">No transactions found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
                <Pagination
                    setCurrentPage = {setCurrentPage}
                    totalPages = {totalPages}
                    currentPage = {currentPage}
                    prevPage = {prevPage}
                    nextPage = {nextPage}
                />
            )}
        </div>
    </div>
  );
};

export default WalletPage;