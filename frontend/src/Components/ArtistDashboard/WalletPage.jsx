import { useState, useEffect } from "react";
import { useUserStore } from "../../store/useUserStore";
import {
  FaWallet,
  FaShieldAlt,
  FaArrowUp,
  FaDollarSign,
  FaPercent,
  FaPiggyBank,
  FaUniversity,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axios from "../../lib/axios";

const WalletPage = () => {
  const { user, loading, verifyBvn } = useUserStore();
  const [showBvnModal, setShowBvnModal] = useState(false);
  const [bvnValue, setBvnValue] = useState("");

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    bankName: "",
    accountName: "",
    swiftCode: "",
  });
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const [earningsData, setEarningsData] = useState({
    grossRevenueUsd: 0,
    platformFeeUsd: 0,
    netPayoutUsd: 0,
    totalWithdrawnUsd: 0,
    availableBalanceUsd: 0,
    artistSharePercentage: 80,
    platformFeePercentage: 20,
  });
  const [isFetchingEarnings, setIsFetchingEarnings] = useState(true);
  const [payoutHistory, setPayoutHistory] = useState([]);


  // Evaluates to false if status is 'unverified' or missing
  const isVerified = user?.verification?.status === "verified";

  const fetchEarningsSummary = async () => {
    try {
      const { data } = await axios.get("/api/reports/wallet-summary");
      setEarningsData({
        ...data,
        availableBalanceUsd: data.availableBalanceUsd ?? data.netPayoutUsd,
      });


    } catch (error) {
      console.error("Failed to fetch wallet summary:", error);
    } finally {
      setIsFetchingEarnings(false);
    }
  };

  useEffect(() => {
    fetchEarningsSummary();
  }, []);


  const fetchPayoutHistory = async () => {
    try {
      const { data } = await axios.get("/api/payouts/history");
      setPayoutHistory(data.payouts);
    } catch (error) {
      console.error("Failed to fetch payout history:", error);
    }
  };

  useEffect(() => {
    fetchPayoutHistory();
  }, []);

  const handleBvnSubmit = async () => {
    if (bvnValue.length !== 11 || !/^\d+$/.test(bvnValue)) {
      return toast.error("BVN must be exactly 11 digits");
    }

    const success = await verifyBvn(bvnValue);
    if (success) {
      setShowBvnModal(false);
      setBvnValue("");
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);

    if (isNaN(amount) || amount < 500) {
      return toast.error("Minimum withdrawal amount is $500");
    }

    const withdrawable = earningsData.availableBalanceUsd ?? earningsData.netPayoutUsd;
    if (amount > withdrawable) {
      return toast.error("Amount exceeds your available withdrawable balance");
    }

    if (!bankForm.accountNumber || !bankForm.bankName || !bankForm.accountName) {
      return toast.error("Please fill in all bank details");
    }

    try {
      setIsSubmittingPayout(true);
      await axios.post("/api/payouts/request", {
        amountUsd: amount,
        bankDetails: bankForm,
      });

      toast.success("Payout request submitted successfully!");
      setShowPayoutModal(false);
      setPayoutAmount("");
      setBankForm({ accountNumber: "", bankName: "", accountName: "" });


      await Promise.all([
        fetchEarningsSummary(),
        fetchPayoutHistory(),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process payout request");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const currentAvailable = earningsData.availableBalanceUsd ?? earningsData.netPayoutUsd;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#EAE4D5]">Wallet & Payouts</h1>
        <p className="text-[#B6B09F] mt-1">
          Manage your catalog earnings, royalty breakdown, and withdrawals.
        </p>
      </div>

      {/* ROYALTY SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Gross Revenue */}
        <div className="bg-[#0a0a0a] border border-[#B6B09F]/10 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#B6B09F] text-xs font-medium uppercase tracking-wider">
              Gross Catalog Revenue
            </span>
            <FaDollarSign className="text-blue-400 text-lg" />
          </div>
          <p className="text-3xl font-bold text-[#EAE4D5]">
            {isFetchingEarnings ? "..." : `$${earningsData.grossRevenueUsd.toFixed(2)}`}
          </p>
          <span className="text-[11px] text-[#B6B09F]/60 mt-1 block">
            100% total generated across DSPs
          </span>
        </div>

        {/* Platform Share (20%) */}
        <div className="bg-[#0a0a0a] border border-[#B6B09F]/10 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#B6B09F] text-xs font-medium uppercase tracking-wider">
              Distribution Fee ({earningsData.platformFeePercentage}%)
            </span>
            <FaPercent className="text-yellow-400 text-sm" />
          </div>
          <p className="text-3xl font-bold text-[#EAE4D5]">
            {isFetchingEarnings ? "..." : `$${earningsData.platformFeeUsd.toFixed(2)}`}
          </p>
          <span className="text-[11px] text-[#B6B09F]/60 mt-1 block">
            Retained platform commission
          </span>
        </div>

        {/* Net Artist Share (80%) */}
        <div className="bg-[#0a0a0a] border border-emerald-500/20 bg-emerald-500/[0.02] p-6 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">
              Your Net Revenue ({earningsData.artistSharePercentage}%)
            </span>
            <FaPiggyBank className="text-emerald-400 text-lg" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            {isFetchingEarnings ? "..." : `$${earningsData.netPayoutUsd.toFixed(2)}`}
          </p>
          <span className="text-[11px] text-emerald-500/60 mt-1 block">
            Total net earnings accrued
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Balance & Withdrawal Card */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#B6B09F]/10 p-8 rounded-xl flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-[#B6B09F] text-sm uppercase tracking-wider font-medium">
                Available for Withdrawal
              </p>
              {/* Minimum Threshold Badge */}
              <span className="text-xs bg-[#B6B09F]/10 text-[#B6B09F] px-2.5 py-1 rounded-full border border-[#B6B09F]/20 font-medium">
                Min. Withdrawal: $500.00
              </span>
            </div>

            <h2 className="text-5xl font-bold text-[#EAE4D5] mt-2">
              {isFetchingEarnings ? "..." : `$${currentAvailable.toFixed(2)}`}
            </h2>

            {/* Dynamic Status Helper Text */}
            {!isFetchingEarnings && currentAvailable < 500 && (
              <p className="text-xs text-yellow-500/80 mt-2">
                You need at least $500.00 in available net balance to request a payout.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={!isVerified || currentAvailable < 500}
              className="flex items-center gap-2 px-6 py-3 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaArrowUp />{" "}
              {currentAvailable < 500 && isVerified
                ? "Below $500 Minimum"
                : "Request Payout"}
            </button>

            {!isVerified && (
              <button
                onClick={() => setShowBvnModal(true)}
                className="flex items-center gap-2 px-6 py-3 border border-[#B6B09F]/40 text-[#EAE4D5] font-bold rounded-lg hover:border-[#EAE4D5] transition-colors"
              >
                <FaShieldAlt /> Verify Identity
              </button>
            )}
          </div>
        </div>

        {/* Account Security / Identity Verification Status */}
        <div className="bg-[#050505] border border-[#B6B09F]/10 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-[#EAE4D5] mb-4">
            Payout Compliance
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[#B6B09F]">Identity Verification</span>
              {isVerified ? (
                <span className="text-green-400 text-sm font-bold bg-green-500/10 px-2 py-1 rounded">
                  VERIFIED
                </span>
              ) : (
                <span className="text-yellow-400 text-sm font-bold bg-yellow-500/10 px-2 py-1 rounded">
                  UNVERIFIED
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#B6B09F]">Royalty Split Rate</span>
              <span className="text-[#EAE4D5] font-bold text-sm">{earningsData.artistSharePercentage}% Artist /{" "}
              {earningsData.platformFeePercentage}% Platform</span>
            </div>
          </div>

          {!isVerified && (
            <div className="mt-6 p-4 bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-lg text-sm">
              <p className="text-[#B6B09F]">
                To comply with regulatory requirements, link your BVN to authorize bank withdrawals.
              </p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-[#B6B09F]/10 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-[#EAE4D5] mb-4">
            Payout Statements
          </h3>

          {payoutHistory.length === 0 ? (
            <div className="text-center py-8 text-[#B6B09F]/60">
              <FaWallet className="text-3xl mx-auto mb-3" />
              <p>No withdrawal transactions completed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#B6B09F]/10 text-xs text-[#B6B09F] uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Destination Bank</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B6B09F]/10 text-sm">
                  {payoutHistory.map((payout) => {
                    // Format status badge color
                    const getStatusBadge = (status) => {
                      switch (status.toLowerCase()) {
                        case "completed":
                        case "approved":
                          return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        case "rejected":
                        case "failed":
                          return "bg-red-500/10 text-red-400 border-red-500/20";
                        case "pending":
                        case "processing":
                        default:
                          return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
                      }
                    };

                    return (
                      <tr key={payout._id} className="hover:bg-[#B6B09F]/5 transition-colors">
                        {/* Date */}
                        <td className="py-4 px-4 text-[#EAE4D5] font-medium whitespace-nowrap">
                          {new Date(payout.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Bank Details */}
                        <td className="py-4 px-4">
                          <p className="text-[#EAE4D5] font-medium">
                            {payout.bankDetails?.bankName || "N/A"}
                          </p>
                          <p className="text-xs text-[#B6B09F] font-mono">
                            •••• {payout.bankDetails?.accountNumber?.slice(-4) || "----"}
                          </p>
                        </td>

                        {/* Amount (Note: schema field is amountUsd) */}
                        <td className="py-4 px-4 text-[#EAE4D5] font-bold font-mono whitespace-nowrap">
                          ${payout.amountUsd?.toFixed(2) || "0.00"}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${getStatusBadge(
                              payout.status
                            )}`}
                          >
                            {payout.status}
                          </span>
                        </td>

                        {/* Failure Reason / Details */}
                        <td className="py-4 px-4 text-right">
                          {payout.failureReason ? (
                            <span
                              className="text-xs text-red-400/80 italic cursor-help"
                              title={payout.failureReason}
                            >
                              {payout.failureReason}
                            </span>
                          ) : (
                            <span className="text-xs text-[#B6B09F]/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* REQUEST PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#B6B09F]/20 p-8 rounded-xl max-w-lg w-full">
            <div className="flex items-center gap-3 mb-2">
              <FaUniversity className="text-emerald-400 text-2xl" />
              <h2 className="text-2xl font-bold text-[#EAE4D5]">Request Payout</h2>
            </div>
            <p className="text-[#B6B09F] mb-6 text-sm">
              Withdraw funds directly to your verified bank account.<br />
              <span className="text-[#B6B09F]/60">Naira rates will be the rate of the day of processing</span>
            </p>


            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-[#B6B09F] text-xs font-medium uppercase mb-1">
                  Amount (USD) — Max: ${currentAvailable.toFixed(2)}
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={currentAvailable}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#B6B09F] text-xs font-medium uppercase mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g. GTBank / Zenith Bank"
                  className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#B6B09F] text-xs font-medium uppercase mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="0123456789"
                  className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#B6B09F] text-xs font-medium uppercase mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  placeholder="Account owner full name"
                  className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#B6B09F] text-xs font-medium mb-1">
                  SWIFT CODE <span className="text-[#B6B09F]/60">If your bank does not support Swift Code, leave it blank.</span>
                </label>
                <input
                  type="text"
                  value={bankForm.swiftCode}
                  onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                  placeholder="Swift code"
                  className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none"
                />
              </div>


              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="flex-grow py-3 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingPayout ? "Submitting..." : "Confirm Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-6 py-3 border border-[#B6B09F]/40 text-[#EAE4D5] rounded-lg hover:border-red-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BVN Modal */}
      {showBvnModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-[#B6B09F]/20 p-8 rounded-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-[#EAE4D5] mb-2">
              Verify Identity
            </h2>
            <p className="text-[#B6B09F] mb-6 text-sm">
              Input your 11-digit BVN to verify your legal identity for payouts.
            </p>

            <input
              type="text"
              maxLength={11}
              value={bvnValue}
              onChange={(e) => setBvnValue(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="w-full px-4 py-3 bg-transparent border border-[#B6B09F]/40 rounded-lg text-[#EAE4D5] focus:border-[#EAE4D5] outline-none transition-colors mb-6 text-center text-xl tracking-widest disabled:opacity-50"
              placeholder="12345678901"
            />

            <div className="flex gap-4">
              <button
                onClick={handleBvnSubmit}
                disabled={loading || bvnValue.length !== 11}
                className="flex-grow py-3 bg-[#EAE4D5] text-[#0a0a0a] font-bold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                onClick={() => {
                  setShowBvnModal(false);
                  setBvnValue("");
                }}
                className="px-6 py-3 border border-[#B6B09F]/40 text-[#EAE4D5] rounded-lg hover:border-red-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
