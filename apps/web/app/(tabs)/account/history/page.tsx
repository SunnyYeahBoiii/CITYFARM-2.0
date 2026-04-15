"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { shopApi } from "@/lib/api/shop.api";
import { ArrowLeftIcon } from "@/components/cityfarm/shared/icons";
import { CityImage } from "@/components/cityfarm/shared/ui";
import { FaCopy, FaCircleCheck, FaBagShopping } from "react-icons/fa6";

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopApi.getMyOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Copied code: " + code);
  };

  return (
    <div className="min-h-full bg-[var(--color-screen)] px-4 py-6">
      <header className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-[color:rgba(31,41,22,0.08)]"
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-heading)]">Order History</h2>
          <p className="text-xs text-[var(--color-muted)]">View your past purchases and activation codes.</p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-green-deep)]"></div>
          <p className="mt-4 text-sm font-medium">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-[var(--color-green-soft)]">
              <FaBagShopping size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-heading)]">No orders yet</h3>
          <p className="text-sm text-[var(--color-muted)] px-10">
            You haven't made any purchases. When you do, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-[color:rgba(31,41,22,0.08)] bg-white overflow-hidden shadow-sm">
              <div className="bg-[var(--color-interactive-bg)] px-4 py-2 flex justify-between items-center border-b border-[color:rgba(31,41,22,0.04)]">
                <span className="text-[10px] font-bold text-[var(--color-green-deep)] uppercase tracking-wider">
                  Order #{order.orderCode.split('-').slice(-1)}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-muted)]">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[#f1f6ec] overflow-hidden flex-shrink-0">
                         {item.product.coverAsset ? (
                           <CityImage src={item.product.coverAsset.publicUrl} alt={item.product.name} sizes="48px" fit="cover" />
                         ) : (
                           <div className="h-full w-full flex items-center justify-center text-xl">📦</div>
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--color-heading)] truncate">{item.product.name}</div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {item.quantity} x {item.unitPriceAmount.toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </div>

                    {item.activationCodes && item.activationCodes.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {item.activationCodes.map((c: any) => (
                          <div 
                            key={c.id} 
                            className="flex items-center justify-between rounded-xl bg-[#1d2319] p-3 text-white"
                          >
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-bold text-gray-500">Activation Code</span>
                              <span className="font-mono text-sm font-bold tracking-wider text-[#99d267]">{c.code}</span>
                            </div>
                            <button 
                              onClick={() => handleCopy(c.code)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <FaCopy size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-3 border-t border-[color:rgba(31,41,22,0.08)] flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[var(--color-green-deep)]">
                    <FaCircleCheck size={12} />
                    <span className="text-[11px] font-bold uppercase tracking-tight">{order.status}</span>
                  </div>
                  <div className="text-sm font-extrabold text-[var(--color-heading)]">
                    {order.totalAmount.toLocaleString('vi-VN')}₫
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
