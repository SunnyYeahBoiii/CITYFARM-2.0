"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getPlantById, getPlants } from "../../../lib/cityfarm";
import { uploadAsset } from "../../../lib/api/assets.api";
import { createPost, loadCommunityData, toggleReaction } from "../../../lib/api/community.api";
import { PostType, type FeedPost, type MarketListing } from "../../../lib/types/community";
import styles from "../cityfarm.module.css";
import {
  ArrowLeftIcon,
  CameraIcon,
  CloseIcon,
  HeartIcon,
  HelpIcon,
  ImageIcon,
  MessageIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SproutIcon,
} from "../shared/icons";
import { Avatar, CityImage } from "../shared/ui";
import { formatDateTime, formatDateShort } from "../../../lib/utils/date";

type CommunityTab = "feed" | "market";
type ComposerType = "caption" | "image" | "plant";

type CommunityScreenProps = {
  initialPosts?: FeedPost[];
  initialListings?: MarketListing[];
};

export function CommunityScreen({ initialPosts, initialListings }: CommunityScreenProps) {
  const hasInitialData = initialPosts !== undefined || initialListings !== undefined;
  const userPlants = getPlants();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const [feedFilter, setFeedFilter] = useState<PostType | "all">("all");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts ?? []);
  const [listings, setListings] = useState<MarketListing[]>(initialListings ?? []);
  const [isCommunityLoading, setIsCommunityLoading] = useState(!hasInitialData);
  const [isCreating, setIsCreating] = useState(false);
  const [postType, setPostType] = useState<ComposerType>("caption");
  const [caption, setCaption] = useState("");
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0);
  const [selectedPlantId, setSelectedPlantId] = useState(userPlants[0]?.id ?? "");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (hasInitialData) {
      setPosts(initialPosts ?? []);
      setListings(initialListings ?? []);
      setIsCommunityLoading(false);
    }
  }, [hasInitialData, initialListings, initialPosts]);

  useEffect(() => {
    if (userPlants[currentPlantIndex]) {
      setSelectedPlantId(userPlants[currentPlantIndex].id);
    }
  }, [currentPlantIndex, userPlants]);

  useEffect(() => {
    if (hasInitialData) {
      return;
    }

    const activeRef = { current: true };
    void reloadCommunityData({
      activeRef,
      setIsCommunityLoading,
      setPosts,
      setListings,
    });

    return () => {
      activeRef.current = false;
    };
  }, [hasInitialData]);

  const filteredPosts = feedFilter === "all" ? posts : posts.filter((post) => post.postType === feedFilter);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetComposer = () => {
    setCaption("");
    setPostType("caption");
    setSelectedImage(null);
    setSelectedFile(null);
    setCurrentPlantIndex(0);
    setIsCreating(false);
  };

  const handleLike = async (postId: string) => {
    const currentPost = posts.find((post) => post.id === postId);
    if (!currentPost) {
      return;
    }

    const wasLiked = Boolean(currentPost.isLiked);
    const optimisticLiked = !wasLiked;
    const baseLikes = currentPost.likes;
    const likesForState = (liked: boolean) => {
      if (liked === wasLiked) {
        return baseLikes;
      }
      return liked ? baseLikes + 1 : Math.max(baseLikes - 1, 0);
    };

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: optimisticLiked,
              likes: likesForState(optimisticLiked),
            }
          : post,
      ),
    );

    try {
      const actualLiked = await toggleReaction(postId);
      if (actualLiked === optimisticLiked) {
        return;
      }

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: actualLiked,
                likes: likesForState(actualLiked),
              }
            : post,
        ),
      );
    } catch {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: wasLiked,
                likes: likesForState(wasLiked),
              }
            : post,
        ),
      );
    }
  };

  const handleCreatePost = async () => {
    if (!caption.trim()) {
      return;
    }

    let imageAssetId: string | undefined;
    if (postType === "image" && selectedFile) {
      try {
        const asset = await uploadAsset(selectedFile, "POST_IMAGE");
        imageAssetId = asset.id;
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Co loi khi tai anh len. Vui long thu lai.");
        return;
      }
    }

    const payloadType = postType === "plant" ? PostType.PLANT_SHARE : PostType.SHOWCASE;
    await createPost({
      postType: payloadType,
      caption,
      imageAssetId,
      gardenPlantId: postType === "plant" ? selectedPlantId : undefined,
    });

    resetComposer();
    await reloadCommunityData({
      setIsCommunityLoading,
      setPosts,
      setListings,
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.screenPadded}>
        <section className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.headerTabs}>
            <button
              type="button"
              className={activeTab === "feed" ? styles.headerTabActive : styles.headerTab}
              onClick={() => setActiveTab("feed")}
            >
              Social Feed
            </button>
            <button
              type="button"
              className={activeTab === "market" ? styles.headerTabActive : styles.headerTab}
              onClick={() => setActiveTab("market")}
            >
              Fresh Market
            </button>
          </div>
          <div className={styles.section} style={{ marginTop: "1rem" }}>
            <div className={styles.marketBanner}>
              <div className={styles.marketBannerTitle}>
                {activeTab === "feed" ? "Share your balcony story" : "Trade verified local harvests"}
              </div>
              <div className={styles.marketBannerText}>
                {activeTab === "feed"
                  ? "Community posts, plant shares, and quick feedback in one stream."
                  : "Buy and sell fresh produce with planting logs attached."}
              </div>
            </div>
          </div>
          <div className={styles.section} style={{ marginTop: "0.75rem", marginBottom: "0.5rem" }}>
            <div className={styles.headerActions}>
              {activeTab === "feed" ? (
                <button type="button" className={styles.iconButton} onClick={() => setIsCreating(true)}>
                  <PlusIcon />
                </button>
              ) : null}
              <button type="button" className={styles.iconButton} aria-label="Search community">
                <SearchIcon />
              </button>
            </div>
          </div>
        </section>

        {activeTab === "feed" ? (
          <section className={styles.section} style={{ marginTop: 0 }}>
            <div className={styles.filterRow}>
              <button
                type="button"
                className={feedFilter === "all" ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFeedFilter("all")}
              >
                All Posts
              </button>
              <button
                type="button"
                className={feedFilter === PostType.SHOWCASE ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFeedFilter(PostType.SHOWCASE)}
              >
                <CameraIcon />
                Showcase
              </button>
              <button
                type="button"
                className={
                  feedFilter === PostType.QUESTION ? styles.filterChipQuestionActive : `${styles.filterChip} ${styles.filterChipQuestion}`
                }
                onClick={() => setFeedFilter(PostType.QUESTION)}
              >
                <HelpIcon />
                Q&amp;A
              </button>
            </div>

            <div className={styles.postFeed}>
              {isCommunityLoading ? <div className={styles.metaText}>Loading community...</div> : null}
              {!isCommunityLoading && filteredPosts.length === 0 ? <div className={styles.metaText}>No posts available yet.</div> : null}

              {filteredPosts.map((post) => {
                const sharedPlant = post.gardenPlantId ? getPlantById(post.gardenPlantId) : undefined;

                return (
                  <div key={post.id} className={styles.postCard}>
                    <div className={styles.postHeader}>
                      <div className={styles.feedHead}>
                        <div className={styles.avatarRow}>
                          <Avatar name={post.user.username} />
                          <div>
                            <div className={styles.headerRow}>
                              <div className={styles.plantName}>{post.user.username}</div>
                              {post.postType === PostType.QUESTION ? <div className={styles.questionPill}>Question</div> : null}
                              {post.postType === PostType.PLANT_SHARE ? <div className={styles.sharePill}>Plant Share</div> : null}
                            </div>
                            <div className={styles.feedMetaText}>{post.user.district}</div>
                          </div>
                        </div>
                        <div className={styles.feedMetaText}>
                          {formatDateTime(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.postBody} style={{ paddingBottom: post.imageUrl ? 0 : "0.5rem" }}>
                      <div className={styles.captionText} style={{ marginBottom: "0.5rem" }}>
                        <div className="leading-relaxed text-[var(--color-heading)] opacity-95">{post.caption}</div>
                      </div>
                    </div>

                    {post.postType !== PostType.QUESTION && post.imageUrl ? (
                      <div className={styles.postImage}>
                        <CityImage src={post.imageUrl} alt={post.caption} sizes="100vw" className="h-full w-full" />
                      </div>
                    ) : null}

                    {post.postType === PostType.PLANT_SHARE && sharedPlant ? (
                      <Link href={`/community/shared/${sharedPlant.id}`} className={styles.shareImage}>
                        <CityImage src={sharedPlant.imageUrl} alt={post.caption} sizes="100vw" className="h-full w-full" fit="contain" />
                      </Link>
                    ) : null}

                    <div className={styles.postBody} style={{ paddingTop: 0 }}>
                      <div className={styles.postActions}>
                        <div className={styles.actionItem}>
                          <button
                            type="button"
                            className={styles.ghostButton}
                            onClick={() => void handleLike(post.id)}
                            style={{ padding: 0, minHeight: "auto", width: "auto" }}
                          >
                            <HeartIcon filled={post.isLiked} />
                          </button>
                          <span className={styles.metaText}>{post.likes}</span>
                        </div>
                        <div className={styles.actionItem}>
                          <MessageIcon />
                          <span className={styles.metaText}>{post.comments}</span>
                        </div>
                      </div>

                      {post.latestComments && post.latestComments.length > 0 ? (
                        <div className={styles.commentList}>
                          {post.latestComments.slice(0, 2).map((comment) => (
                            <div key={comment.id} className={styles.commentItem}>
                              <span className={styles.commentUser}>{comment.user.username}</span>
                              {comment.body}
                            </div>
                          ))}
                          {post.comments > 2 && (
                            <div className={styles.viewComments}>View all {post.comments} comments</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className={styles.section} style={{ marginTop: 0 }}>
            <div className={styles.listingFeed}>
              {!isCommunityLoading && listings.length === 0 ? <div className={styles.metaText}>No marketplace listings available.</div> : null}
              {listings.map((listing) => (
                <div key={listing.id} className={styles.listingCard}>
                  <div className={styles.listingBody}>
                    <div className={styles.listingRow}>
                      <div className={styles.listingImage}>
                        {listing.imageUrl ? (
                          <CityImage src={listing.imageUrl} alt={listing.product} sizes="88px" className="h-full w-full" fit="contain" />
                        ) : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.listingHead}>
                          <div>
                            <div className={styles.plantName}>{listing.product}</div>
                            <div className={styles.metaText}>
                              {listing.quantity} • {formatDateShort(listing.createdAt)}
                            </div>
                          </div>
                          <div className={styles.matchPill}>₫{listing.priceAmount.toLocaleString()}</div>
                        </div>
                        <div className={styles.captionText} style={{ marginTop: "0.55rem" }}>
                          {listing.description}
                        </div>
                        <div className={styles.tagRow} style={{ marginTop: "0.75rem" }}>
                          <span className={styles.tag}>{listing.seller.username}</span>
                          <span className={styles.tag}>{listing.seller.district}</span>
                          {listing.seller.verifiedGrower ? <span className={styles.verifiedPill}>Verified Grower</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {isCreating ? (
        <div className={styles.composerOverlay} onClick={resetComposer}>
          <div className={styles.composerSheet} onClick={(event) => event.stopPropagation()}>
            <div className={styles.sheetHead}>
              <div>
                <div className={styles.sectionTitle}>Create Post</div>
                <div className={styles.sectionSubtitle}>Share your journey with the community</div>
              </div>
              <button type="button" className={styles.iconButton} onClick={resetComposer}>
                <CloseIcon />
              </button>
            </div>

            <div className={styles.sheetBody}>
              <div className={styles.orderTabs}>
                <ComposerTab active={postType === "caption"} icon={<PinIcon />} label="Caption" onClick={() => setPostType("caption")} />
                <ComposerTab active={postType === "image"} icon={<ImageIcon />} label="Photo" onClick={() => setPostType("image")} />
                <ComposerTab active={postType === "plant"} icon={<SproutIcon />} label="Plant" onClick={() => setPostType("plant")} />
              </div>

              <div className={styles.section}>
                <textarea
                  className={styles.textarea}
                  placeholder="Write your update..."
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  style={{ minHeight: "130px", fontSize: "1rem" }}
                />
              </div>

              {postType === "image" ? (
                <div className={styles.section}>
                  <div className={styles.sectionSubtitle}>Select a photo</div>
                  <button
                    type="button"
                    className={styles.imagePlaceholder}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      backgroundImage: selectedImage ? `url(${selectedImage})` : "none",
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  >
                    {!selectedImage ? (
                      <div className="flex flex-col items-center gap-2 text-[#37542d] opacity-50">
                        <PlusIcon />
                        <span className="text-sm font-bold">Tap to upload</span>
                      </div>
                    ) : null}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </button>
                </div>
              ) : null}

              {postType === "plant" && userPlants.length > 0 ? (
                <PlantSharePicker currentPlantIndex={currentPlantIndex} plants={userPlants} onChange={setCurrentPlantIndex} />
              ) : null}

              <div style={{ marginTop: "2rem" }}>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  style={{ width: "100%", padding: "1rem" }}
                  onClick={() => void handleCreatePost()}
                >
                  Post to Community
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ComposerTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? styles.filterChipActive : styles.filterChip} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function PlantSharePicker({
  plants,
  currentPlantIndex,
  onChange,
}: {
  plants: ReturnType<typeof getPlants>;
  currentPlantIndex: number;
  onChange: (value: number) => void;
}) {
  const activePlant = plants[currentPlantIndex];
  if (!activePlant) {
    return null;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionSubtitle}>Select a plant to share</div>

      <div className={styles.horizontalSelector}>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonLeft}`}
          onClick={() => onChange(Math.max(0, currentPlantIndex - 1))}
          disabled={currentPlantIndex === 0}
        >
          <ArrowLeftIcon />
        </button>

        <div className={styles.selectorContainer}>
          <div className={styles.plantSlide}>
            <div className={styles.plantSlideImage}>
              <CityImage src={activePlant.imageUrl} alt={activePlant.name} sizes="160px" className="h-full w-full" fit="contain" />
            </div>
            <div className={styles.plantSlideContent}>
              <div className={styles.plantSlideType}>{activePlant.type}</div>
              <div className={styles.plantSlideName}>{activePlant.name}</div>

              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarBase}>
                  <div className={styles.progressBarFill} style={{ width: `${activePlant.progress}%` }} />
                </div>
                <div className={styles.progressInfo}>
                  <span>Day {activePlant.daysGrowing}</span>
                  <span>{activePlant.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonRight}`}
          onClick={() => onChange(Math.min(plants.length - 1, currentPlantIndex + 1))}
          disabled={currentPlantIndex === plants.length - 1}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
            <ArrowLeftIcon />
          </span>
        </button>
      </div>

      <div className={styles.navIndicator}>
        {plants.map((plant, index) => (
          <div
            key={plant.id}
            className={index === currentPlantIndex ? `${styles.navDot} ${styles.navDotActive}` : styles.navDot}
          />
        ))}
      </div>
    </div>
  );
}

async function reloadCommunityData({
  activeRef,
  setIsCommunityLoading,
  setPosts,
  setListings,
}: {
  activeRef?: { current: boolean };
  setIsCommunityLoading: (value: boolean) => void;
  setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>;
  setListings: React.Dispatch<React.SetStateAction<MarketListing[]>>;
}) {
  try {
    setIsCommunityLoading(true);
    const result = await loadCommunityData();

    if (activeRef && !activeRef.current) {
      return;
    }

    setPosts(result.posts ?? []);
    setListings(result.listings ?? []);
  } finally {
    if (!activeRef || activeRef.current) {
      setIsCommunityLoading(false);
    }
  }
}
