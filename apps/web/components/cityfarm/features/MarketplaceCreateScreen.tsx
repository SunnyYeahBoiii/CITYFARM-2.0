"use client"

import React, { useState, useEffect, useMemo, useId } from "react";
import Link from "next/link";
import { ChevronLeft, Camera, ShoppingBag, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "../cityfarm.module.css";
import { gardenApi } from "@/lib/api/garden.api";
import { createMarketplaceListing } from "@/lib/api/community.api";
import { uploadAsset } from "@/lib/api/assets.api";
import { getProfile } from "@/lib/api/auth.api";
import { GardenPlantDetail } from "@/lib/types/garden";
import { CurrentUser } from "@/lib/types/auth";

interface MarketplaceCreateScreenProps {
  plantId: string;
}

export function MarketplaceCreateScreen({ plantId }: MarketplaceCreateScreenProps) {
  const router = useRouter();
  const fileInputId = useId();
  
  const [plant, setPlant] = useState<GardenPlantDetail | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("kg");
  const [description, setDescription] = useState("");
  const [imageAssetId, setImageAssetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLatestPhoto, setIsLatestPhoto] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const [plantData, userData] = await Promise.all([
          gardenApi.getPlantDetail(plantId),
          getProfile()
        ]);
        
        setPlant(plantData);
        setUser(userData);
        
        setProduct(plantData.nickname || plantData.plantSpecies.commonName);
        
        const latestJournalPhoto = plantData.journalEntries?.find(j => j.imageAsset?.publicUrl)?.imageAsset;
        if (latestJournalPhoto) {
          setImageAssetId(latestJournalPhoto.id || null);
          setPreviewUrl(latestJournalPhoto.publicUrl);
        } else {
          const speciesPhoto = plantData.plantSpecies.products[0]?.coverAsset;
          if (speciesPhoto) {
            setPreviewUrl(speciesPhoto.publicUrl);
          }
        }
      } catch (err: any) {
        setError("Failed to load plant data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [plantId]);

  const latestJournalPhoto = useMemo(() => {
    return plant?.journalEntries?.find(j => j.imageAsset?.publicUrl)?.imageAsset;
  }, [plant]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsLatestPhoto(false);
      const asset = await uploadAsset(file, "MARKETPLACE");
      setImageAssetId(asset.id);
    } catch (err) {
      setError("Failed to upload image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const useLatestPhoto = () => {
    if (latestJournalPhoto) {
      setPreviewUrl(latestJournalPhoto.publicUrl);
      setImageAssetId(latestJournalPhoto.id || null);
      setIsLatestPhoto(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (!product || !price || !quantity) {
        throw new Error("Please fill in all required fields.");
      }

      await createMarketplaceListing({
        gardenPlantId: plantId,
        product,
        quantity: quantity,
        unit: unit,
        priceAmount: parseInt(price, 10),
        description,
        imageAssetId: imageAssetId || undefined,
      });

      router.push("/garden");
    } catch (err: any) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.detailScreen}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#567a3d] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!plant) return null;

  const isVerified = user?.profile?.growerVerificationStatus === "VERIFIED";

  return (
    <div className={styles.detailScreen}>
      {/* Header */}
      <div className={styles.screenHeader}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <ChevronLeft />
        </button>
        <span className={styles.screenHeaderTitle}>Create Listing</span>
        <div style={{ width: 40 }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        {/* Photo Selection */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#f8faf7] p-1 border border-black/5 shadow-sm">
          <div className="relative aspect-video w-full overflow-hidden rounded-[1.8rem]">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 text-gray-400">
                <Camera size={48} strokeWidth={1} />
                <span className="mt-2 text-sm font-medium">No photo selected</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-3">
              <label 
                htmlFor={fileInputId}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/30 cursor-pointer"
              >
                <Camera size={16} /> Change Photo
              </label>
              
              {latestJournalPhoto && !isLatestPhoto && (
                <button
                  type="button"
                  onClick={useLatestPhoto}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#567a3d] px-4 py-2.5 text-xs font-bold text-white shadow-lg"
                >
                  <CheckCircle2 size={16} /> Use Latest Journal
                </button>
              )}
            </div>
          </div>
          <input id={fileInputId} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>

        {/* Info Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold uppercase tracking-widest text-[#677562] ml-1">Product Name</label>
            <input 
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className={styles.input}
              placeholder="e.g. Fresh Organic Tomatoes"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-widest text-[#677562] ml-1">Price (CityCoins)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`${styles.input} pl-10`}
                  placeholder="0"
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🪙</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-widest text-[#677562] ml-1">Quantity</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`${styles.input} flex-1`}
                  placeholder="1"
                  required
                />
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="rounded-2xl border-0 bg-[#f8faf7] px-3 font-bold text-[#24301c] focus:ring-2 focus:ring-[#567a3d]/20 transition-all outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="gram">g</option>
                  <option value="bunch">bunch</option>
                  <option value="piece">pcs</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-extrabold uppercase tracking-widest text-[#677562] ml-1">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Freshly harvested from my garden this morning. No chemical pesticides used."
            />
          </div>
        </div>

        {/* Verification Alert */}
        <div className={`rounded-3xl p-4 flex gap-4 ${isVerified ? 'bg-[#f1f6ec] border border-[#567a3d]/10' : 'bg-amber-50 border border-amber-200'}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isVerified ? 'bg-[#567a3d]/10 text-[#567a3d]' : 'bg-amber-100 text-amber-600'}`}>
            {isVerified ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-sm font-bold text-[#1f2916]">
              {isVerified ? 'Verified Grower Badge' : 'Not Verified Yet'}
            </div>
            <div className="text-xs text-[#677562] leading-relaxed">
              {isVerified 
                ? 'Your listing will display a verified badge to build trust with buyers.' 
                : 'Verified growers typically sell 3x faster. You can still list, but we recommend getting verified!'}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 flex items-center gap-3 text-red-600 border border-red-100">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`${styles.buttonPrimary} w-full h-14 text-base gap-3 shadow-[0_12px_35px_rgba(81,111,70,0.3)]`}
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <ShoppingBag size={20} />
          )}
          {isSubmitting ? "Publishing..." : "Publish Listing"}
        </button>
      </form>
    </div>
  );
}
