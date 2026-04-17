"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrdersHistory, type OrderResponse } from "@/lib/api/order.api";
import styles from "@/components/cityfarm/cityfarm.module.css";
import { ArrowLeftIcon, BagIcon, CheckIcon, SproutIcon } from "@/components/cityfarm/shared/icons";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersHistory()
      .then(setOrders)
      .catch((err) => console.error("Failed to fetch history:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.screen}>
      <div className={styles.screenHeader}>
        <div className={styles.headerRow}>
          <Link href="/account" className={styles.backButton}>
            <ArrowLeftIcon />
          </Link>
          <h1 className={styles.screenHeaderTitle}>Lịch sử đơn hàng</h1>
        </div>
      </div>

      <div className={styles.screenPadded}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-(--color-muted)">
            Đang tải lịch sử...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-4xl opacity-20">📦</div>
            <p className={styles.sectionSubtitle}>Bạn chưa có đơn hàng nào.</p>
            <Link href="/order" className="mt-4 font-bold text-(--color-primary)">
              Đến Shop ngay
            </Link>
          </div>
        ) : (
          <div className={styles.listStack}>
            {orders.map((order) => (
              <div key={order.id} className={styles.card}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) mb-1">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className={styles.plantName}>{order.orderCode}</div>
                  </div>
                  <div className={styles.statusPill}>
                    {order.status === "COMPLETED" ? "Đã hoàn thành" : "Đã xác nhận"}
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-t border-(--color-border-subtle)">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-primary-subtle) text-(--color-primary)">
                        {item.product.type === "KIT" ? <BagIcon /> : <SproutIcon />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{item.product.name}</div>
                        <div className="text-xs text-(--color-muted)">
                          {item.quantity} x {item.product.priceAmount.toLocaleString()}đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.activationCode && (
                  <div className="mt-4 p-3 rounded-xl bg-(--color-primary-subtle)/30 border border-(--color-primary-subtle)">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-(--color-primary) mb-1">
                      Mã kích hoạt
                    </div>
                    <div className="font-mono text-lg font-bold text-(--color-primary)">
                      {order.activationCode}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-(--color-border-subtle)">
                  <span className="text-xs font-bold text-(--color-muted)">Tổng thanh toán</span>
                  <span className="text-base font-extrabold text-(--color-primary)">
                    {order.totalAmount.toLocaleString()}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
