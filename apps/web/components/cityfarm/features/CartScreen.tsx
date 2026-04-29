"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from "../../../lib/useCart";
import styles from "../cityfarm.module.css";
import { ArrowLeftIcon, BagIcon, MinusIcon, PlusIcon, TrashIcon } from "../shared/icons";

export default function CartScreen() {
  const router = useRouter();
  const { data: cart, isLoading, error } = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeMutation.mutate(itemId);
    } else {
      updateMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeMutation.mutate(itemId);
  };

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearMutation.mutate();
    }
  };

  const handleCheckout = () => {
    router.push("/checkout?from=cart");
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString("vi-VN")}`;
  };

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <div className={styles.screenHeader}>
          <button className={styles.backButton}>
            <ArrowLeftIcon />
          </button>
          <h1 className={styles.screenHeaderTitle}>Shopping Cart</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.screenPadded}>
          <div className={styles.listStack}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.card}>
                <div className={styles.listingRow}>
                  <div
                    className={styles.listingImage}
                    style={{ background: "#f1f6ec" }}
                  />
                  <div className={styles.plantBody}>
                    <div
                      style={{
                        height: 20,
                        background: "#e8f0e2",
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 14,
                        background: "#edf3e8",
                        borderRadius: 6,
                        width: "60%",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.screen}>
        <div className={styles.screenHeader}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeftIcon />
          </button>
          <h1 className={styles.screenHeaderTitle}>Shopping Cart</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.screenPadded}>
          <div className={styles.mutedCard}>
            <p className={styles.metaText}>
              Unable to load cart. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.screen}>
        <div className={styles.screenHeader}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeftIcon />
          </button>
          <h1 className={styles.screenHeaderTitle}>Shopping Cart</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.screenPadded}>
          <div className={styles.successStage}>
            <div className={styles.successIcon}>
              <BagIcon />
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#24301c",
                marginBottom: "0.5rem",
              }}
            >
              Your cart is empty
            </h2>
            <p
              style={{
                color: "#677562",
                fontSize: "0.92rem",
                marginBottom: "1.5rem",
              }}
            >
              Browse our marketplace to find seeds, kits, and more!
            </p>
            <Link href="/marketplace" className={styles.buttonPrimary}>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.screenHeader}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <ArrowLeftIcon />
        </button>
        <h1 className={styles.screenHeaderTitle}>
          Shopping Cart ({cart.itemCount})
        </h1>
        <button
          className={styles.ghostButton}
          onClick={handleClearCart}
          style={{ fontSize: "0.85rem", minHeight: "auto", padding: "0.5rem 0.75rem" }}
        >
          Clear
        </button>
      </div>

      <div className={styles.screenPadded}>
        <div className={styles.listStack}>
          {cart.items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.listingRow}>
                <div className={styles.listingImage}>
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(145deg, #eef5e9, #f8fbf5)",
                        color: "#567a3d",
                        fontSize: "1.5rem",
                      }}
                    >
                      {item.product.type === "KIT" ? "📦" :
                       item.product.type === "SEED" ? "🌱" :
                       item.product.type === "SOIL" ? "🪴" : "🛒"}
                    </div>
                  )}
                </div>
                <div className={styles.plantBody}>
                  <div className={styles.plantTopRow}>
                    <div>
                      <h3 className={styles.plantName}>{item.product.name}</h3>
                      <p className={styles.plantMeta}>
                        {formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ width: 28, height: 28, fontSize: 14 }}
                      disabled={removeMutation.isPending}
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {item.product.components && item.product.components.length > 0 && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "#677562",
                        marginTop: "0.35rem",
                        lineHeight: 1.4,
                      }}
                    >
                      Includes: {item.product.components.map(c =>
                        c.quantity > 1 ? `${c.quantity}x ${c.componentName}` : c.componentName
                      ).join(", ")}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        className={styles.iconButton}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        style={{ width: 28, height: 28 }}
                        disabled={updateMutation.isPending}
                      >
                        <MinusIcon />
                      </button>
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "bold",
                          color: "#24301c",
                          minWidth: "2rem",
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        style={{ width: 28, height: 28 }}
                        disabled={updateMutation.isPending}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <span
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: "bold",
                        color: "#567a3d",
                      }}
                    >
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className={styles.summaryCard} style={{ marginTop: "1.5rem" }}>
          <div className={styles.summaryLabel}>Order Summary</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1rem",
              fontSize: "0.95rem",
              color: "#24301c",
            }}
          >
            <span>Subtotal ({cart.itemCount} items)</span>
            <span style={{ fontWeight: "bold" }}>{formatPrice(cart.subtotal)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "0.5rem",
              fontSize: "0.86rem",
              color: "#677562",
            }}
          >
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div
            style={{
              height: 1,
              background: "rgba(31,41,22,0.08)",
              margin: "1rem 0",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#24301c",
            }}
          >
            <span>Total</span>
            <span style={{ color: "#567a3d" }}>{formatPrice(cart.subtotal)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          className={styles.buttonPrimary}
          onClick={handleCheckout}
          disabled={updateMutation.isPending || removeMutation.isPending}
          style={{
            width: "100%",
            marginTop: "1.5rem",
            fontSize: "1rem",
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}