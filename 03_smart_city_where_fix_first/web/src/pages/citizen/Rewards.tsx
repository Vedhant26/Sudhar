import { useState } from 'react'
import confetti from 'canvas-confetti'
import { useAuthStore } from '../../stores/authStore'

export default function Rewards() {
  const { user, transactions, redeemCoins } = useAuthStore()

  // Redeem Modal state
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [selectedCoins, setSelectedCoins] = useState<number>(100)
  const [customCoins, setCustomCoins] = useState<string>('')
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'Bank' | 'Voucher'>('UPI')
  const [payoutDetails, setPayoutDetails] = useState<string>('citizen@okhdfcbank')
  const [bankIfsc, setBankIfsc] = useState<string>('HDFC0001234')
  const [bankAccount, setBankAccount] = useState<string>('50100234567890')
  const [isProcessing, setIsProcessing] = useState(false)
  const [payoutReceipt, setPayoutReceipt] = useState<{
    referenceId: string
    coins: number
    cash: number
    method: string
    details: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'leaderboard'>('history')

  const userCoins = user?.civic_coins || 0
  const coinToInrRate = 0.5 // 1 CivicCoin = ₹0.50 INR (100 coins = ₹50)

  const coinsToRedeem = customCoins ? parseInt(customCoins, 10) || 0 : selectedCoins
  const cashEquivalent = Math.round(coinsToRedeem * coinToInrRate)

  const badges = [
    { id: 1, name: 'First Report', icon: '🌟', earned: (user?.reports_count || 0) >= 1 },
    { id: 2, name: 'Road Warrior', icon: '🛣️', earned: (user?.reports_count || 0) >= 5 },
    { id: 3, name: 'City Hero', icon: '🦸', earned: (user?.reports_count || 0) >= 10 },
    { id: 4, name: 'Verified Auditor', icon: '🛡️', earned: (user?.verified_reports || 0) >= 3 },
    { id: 5, name: 'Civic Earner', icon: '💰', earned: transactions.some(t => t.type === 'redeem') },
  ]

  const handleOpenRedeem = () => {
    setPayoutReceipt(null)
    setShowRedeemModal(true)
  }

  const handleExecutePayout = () => {
    if (coinsToRedeem <= 0 || coinsToRedeem > userCoins) {
      alert(`Invalid coin amount. You have ${userCoins} CivicCoins available.`)
      return
    }

    const detailsStr = payoutMethod === 'UPI' 
      ? payoutDetails 
      : payoutMethod === 'Bank'
      ? `${bankAccount} (${bankIfsc})`
      : `${user?.email || 'citizen@demo'} (Voucher)`

    setIsProcessing(true)

    setTimeout(() => {
      setIsProcessing(false)
      const res = redeemCoins(coinsToRedeem, cashEquivalent, payoutMethod, detailsStr)
      if (res.success) {
        setPayoutReceipt({
          referenceId: res.referenceId,
          coins: coinsToRedeem,
          cash: cashEquivalent,
          method: payoutMethod,
          details: detailsStr,
        })
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      }
    }, 1200)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-28">
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Civic Rewards & Cashout</h1>
          <p className="text-xs text-gray-500">Earn coins by reporting & fixing city hazards. Convert directly to real money.</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block">Conversion Rate</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
            100 Coins = ₹50
          </span>
        </div>
      </div>

      {/* CivicCoins Balance Card */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-yellow-100 text-xs uppercase tracking-wider font-medium">Your Active Civic Balance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-extrabold tracking-tight">{userCoins}</span>
                <span className="text-yellow-200 font-semibold text-lg">Coins</span>
              </div>
            </div>
            <div className="text-right bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl">
              <span className="text-xs text-yellow-100 block">Cash Value</span>
              <span className="text-xl font-bold text-white">₹{(userCoins * coinToInrRate).toFixed(1)}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleOpenRedeem}
              className="flex-1 py-3.5 bg-white text-yellow-800 font-bold rounded-2xl hover:bg-yellow-50 active:scale-95 transition shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <span>💸</span>
              <span>Convert to Real Money</span>
            </button>
          </div>
        </div>
      </div>

      {/* Level & Trust Score */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-500 text-xs uppercase font-medium">Citizen Level</p>
            <span className="text-lg">⭐</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Level {user?.level || 1}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((user?.civic_coins || 0) % 150) / 1.5)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Earn more coins to level up
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-500 text-xs uppercase font-medium">Trust Score</p>
            <span className="text-lg">🛡️</span>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {user?.trust_score || 85}%
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${user?.trust_score || 85}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {user?.verified_reports || 0} reports verified by authority
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Civic Achievements</h2>
        <div className="grid grid-cols-5 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`
                aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition
                ${badge.earned
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-40'
                }
              `}
            >
              <span className="text-2xl mb-1">{badge.icon}</span>
              <p className="text-[10px] leading-tight font-semibold text-gray-800 dark:text-gray-200">
                {badge.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs: Transaction History & Leaderboard */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Coin Ledger & Payouts ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'leaderboard'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          City Leaderboard
        </button>
      </div>

      {/* Tab 1: Ledger / History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  tx.type === 'earn'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {tx.type === 'earn' ? '🪙' : '💸'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {tx.reason}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                    {tx.payment_method && (
                      <span className="px-1.5 py-0.2 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {tx.payment_method}: {tx.payment_details}
                      </span>
                    )}
                    {tx.reference_id && (
                      <span className="font-mono text-gray-400">
                        Ref: {tx.reference_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-bold text-sm block ${
                  tx.type === 'earn'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {tx.type === 'earn' ? `+${tx.amount} coins` : `-${tx.amount} coins`}
                </span>
                {tx.cash_amount && (
                  <span className="text-xs text-green-600 font-bold block">
                    (₹{tx.cash_amount} credited)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
          {[
            { rank: 1, name: 'Ananya Sharma', coins: 1450, avatar: '🏆', title: 'Grand Guardian' },
            { rank: 2, name: 'Vikram Reddy', coins: 980, avatar: '⭐', title: 'Road Master' },
            { rank: 3, name: user?.name || 'Demo Citizen', coins: user?.civic_coins || 450, avatar: '👤', title: 'Community Hero', isYou: true },
            { rank: 4, name: 'Priya Patel', coins: 340, avatar: '🌟', title: 'Active Reporter' },
            { rank: 5, name: 'Rahul Verma', coins: 220, avatar: '🌱', title: 'Civic Scout' },
          ].map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                entry.isYou ? 'bg-blue-50/70 dark:bg-blue-900/30' : ''
              }`}
            >
              <span className={`text-xl font-bold w-6 text-center ${
                entry.rank === 1 ? 'text-yellow-500' :
                entry.rank === 2 ? 'text-gray-400' :
                entry.rank === 3 ? 'text-amber-600' : 'text-gray-400'
              }`}>
                #{entry.rank}
              </span>
              <span className="text-2xl">{entry.avatar}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {entry.name}
                  {entry.isYou && <span className="text-xs text-blue-600 dark:text-blue-400 font-bold ml-2">(You)</span>}
                </p>
                <p className="text-xs text-gray-500">{entry.title}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">🪙 {entry.coins}</span>
                <span className="text-xs text-gray-400 block">≈ ₹{entry.coins * 0.5}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Convert to Money Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-700">
            {!payoutReceipt ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">💸</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Convert Coins to Money</h2>
                      <p className="text-xs text-gray-500">Instant direct transfer to your bank or UPI</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRedeemModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Coin amount selector */}
                <div className="mb-4">
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 block">
                    Choose Coins to Cash Out
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[50, 100, 200].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedCoins(amt)
                          setCustomCoins('')
                        }}
                        className={`py-2 px-3 rounded-xl border text-sm font-bold transition ${
                          selectedCoins === amt && !customCoins
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {amt} Coins (₹{amt * 0.5})
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    placeholder={`Or enter custom coins (max ${userCoins})`}
                    value={customCoins}
                    onChange={(e) => setCustomCoins(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Amount preview badge */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">Payout Amount:</span>
                    <p className="text-2xl font-black text-green-800 dark:text-green-200">₹{cashEquivalent}</p>
                  </div>
                  <div className="text-right text-xs text-green-700 dark:text-green-300">
                    <p className="font-semibold">{coinsToRedeem} CivicCoins</p>
                    <p className="opacity-75">Deducted from balance</p>
                  </div>
                </div>

                {/* Payout method selector */}
                <div className="mb-4">
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 block">
                    Select Transfer Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { id: 'UPI', label: '📲 UPI', sub: 'Instant' },
                      { id: 'Bank', label: '🏦 IMPS Bank', sub: 'Direct A/C' },
                      { id: 'Voucher', label: '🎁 Gift Card', sub: 'Amazon' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id as any)}
                        className={`p-2 rounded-xl border text-center transition ${
                          payoutMethod === m.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className="text-xs block font-bold">{m.label}</span>
                        <span className="text-[10px] text-gray-400">{m.sub}</span>
                      </button>
                    ))}
                  </div>

                  {payoutMethod === 'UPI' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Enter UPI ID (VPA)</label>
                      <input
                        type="text"
                        value={payoutDetails}
                        onChange={(e) => setPayoutDetails(e.target.value)}
                        placeholder="e.g. mobile@upi or username@okhdfcbank"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  )}

                  {payoutMethod === 'Bank' && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Bank Account Number</label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">IFSC Code</label>
                        <input
                          type="text"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {payoutMethod === 'Voucher' && (
                    <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
                      An Amazon Pay e-Gift Card worth ₹{cashEquivalent} will be instantly generated and emailed to <b>{user?.email || 'citizen@demo'}</b>.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleExecutePayout}
                  disabled={isProcessing || userCoins < coinsToRedeem || coinsToRedeem <= 0}
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Instant Bank Transfer...</span>
                    </>
                  ) : (
                    <span>Confirm & Transfer ₹{cashEquivalent} Now</span>
                  )}
                </button>
              </>
            ) : (
              /* Success Receipt */
              <div className="text-center py-2 animate-slide-up">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Payout Successful!
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Funds have been transferred to your designated account.
                </p>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 text-left space-y-2 mb-6 border border-gray-200 dark:border-gray-700 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-bold text-green-600">₹{payoutReceipt.cash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coins Deducted:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{payoutReceipt.coins} CivicCoins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{payoutReceipt.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Beneficiary:</span>
                    <span className="font-mono text-xs">{payoutReceipt.details}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">Bank Ref UTR:</span>
                    <span className="font-mono text-xs text-blue-600 font-bold">{payoutReceipt.referenceId}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
