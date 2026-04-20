"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getPlantById, getPlants } from "@/lib/cityfarm";
import { getHarvestDays } from "@/lib/cityfarm/utils";
import { uploadAsset } from "@/lib/api/assets.api";
import { gardenApi } from "@/lib/api/garden.api";
import { createComment, createPost, deleteComment, deletePost, getPostComments, loadCommunityData, toggleReaction } from "@/lib/api/community.api";
import { PostType, type FeedPost, type MarketListing, type FeedComment } from "@/lib/types/community";
import { useAuth } from "@/context/AuthContext";
import styles from "../cityfarm.module.css";
import {
  ArrowLeftIcon,
  CameraIcon,
  CloseIcon,
  HeartIcon,
  HelpIcon,
  ImageIcon,
  MessageIcon,
  MoreIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SproutIcon,
  TrashIcon,
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
  const [gardenPlants, setGardenPlants] = useState<any[]>([]);
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
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  
  // Comment states
  const [activeCommentPost, setActiveCommentPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (hasInitialData) {
      setPosts(initialPosts ?? []);
      setListings(initialListings ?? []);
      setIsCommunityLoading(false);
    }
  }, [hasInitialData, initialListings, initialPosts]);

  useEffect(() => {
    const fetchGarden = async () => {
      try {
        const data = await gardenApi.getMyGarden();
        const mapped = data.map(plant => {
          const daysGrowing = Math.floor((new Date().getTime() - new Date(plant.plantedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          const harvestDays = getHarvestDays(plant as any);
          const progress = Math.min(100, Math.round((daysGrowing / harvestDays) * 100));

          return {
            id: plant.id,
            name: plant.nickname || `${plant.plantSpecies.commonName} (${new Date(plant.plantedAt).getDate().toString().padStart(2, '0')}/${(new Date(plant.plantedAt).getMonth() + 1).toString().padStart(2, '0')})`,
            type: plant.plantSpecies.commonName,
            imageUrl: plant.plantSpecies.products[0]?.coverAsset?.publicUrl || "/images/placeholder-plant.png",
            daysGrowing,
            progress
          };
        });
        setGardenPlants(mapped);
        if (mapped.length > 0) {
          setSelectedPlantId(mapped[0]?.id || "");
        }
      } catch (error) {
        console.error("Failed to fetch garden plants:", error);
      }
    };
    fetchGarden();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActivePostMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (gardenPlants[currentPlantIndex]) {
      setSelectedPlantId(gardenPlants[currentPlantIndex]?.id || "");
    }
  }, [currentPlantIndex, gardenPlants]);

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
    if (selectedFile) {
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Ban co chac chan muon xoa bai dang nay khong?")) {
      return;
    }

    try {
      await deletePost(postId);
      await reloadCommunityData({
        setIsCommunityLoading,
        setPosts,
        setListings,
      });
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Co loi khi xoa bai. Vui long thu lai.");
    }
  };

  const openComments = async (post: FeedPost) => {
    setActiveCommentPost(post);
    setIsCommentsLoading(true);
    setComments([]);
    setReplyingToId(null);
    setNewCommentText("");

    try {
      const data = await getPostComments(post.id);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!activeCommentPost || !newCommentText.trim()) return;

    const trimmedBody = newCommentText.trim();
    // Optimistic update would be nice, but let's keep it simple for now
    try {
      await createComment(activeCommentPost.id, trimmedBody, replyingToId || undefined);
      setNewCommentText("");
      setReplyingToId(null);
      
      // Refresh comments and the main feed to update counts
      const data = await getPostComments(activeCommentPost.id);
      setComments(data);
      
      await reloadCommunityData({
        setIsCommunityLoading,
        setPosts,
        setListings,
      });
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert("Khong the gui binh luan. Vui long thu lai.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Ban co chac chan muon xoa binh luan nay khong?")) return;

    try {
      await deleteComment(commentId);
      if (activeCommentPost) {
        const data = await getPostComments(activeCommentPost.id);
        setComments(data);
        
        await reloadCommunityData({
          setIsCommunityLoading,
          setPosts,
          setListings,
        });
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
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

                return (
                  <div key={post.id} className={styles.postCard}>
                    <div className={styles.postHeader}>
                      <div className={styles.postHeaderWrapper}>
                        <div className={styles.avatarRow}>
                          <Avatar name={post.user.username} />
                          <div>
                            <div className={styles.headerRow} style={{ marginBottom: "0.15rem" }}>
                              <div className={styles.plantName}>{post.user.username}</div>
                              {post.postType === PostType.QUESTION ? <div className={styles.questionPill}>Question</div> : null}
                              {post.postType === PostType.PLANT_SHARE ? <div className={styles.sharePill}>Plant Share</div> : null}
                            </div>
                            <div className={styles.feedMetaText}>
                              {post.user.district}
                              {post.user.district && post.createdAt && (
                                <span style={{ opacity: 0.5, margin: "0 0.25rem" }}>•</span>
                              )}
                              {formatDateTime(post.createdAt)}
                            </div>
                          </div>
                        </div>

                        {(user.id == post.userId || user.id == post.user.id) && (
                          <div className={styles.postMenuContainer} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.iconButton}
                              onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                              style={{ 
                                width: "32px", 
                                height: "32px", 
                                opacity: 1, 
                                marginRight: "-0.5rem",
                                color: "#1f2916" 
                              }}
                            >
                              <MoreIcon size={22} />
                            </button>

                            {activePostMenuId === post.id && (
                              <div className={styles.postMenuDropdown}>
                                <button
                                  type="button"
                                  className={`${styles.postMenuItem} ${styles.postMenuItemDelete}`}
                                  onClick={() => {
                                    setActivePostMenuId(null);
                                    void handleDeletePost(post.id);
                                  }}
                                >
                                  <TrashIcon size={16} />
                                  Delete Post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.postBody} style={{ paddingBottom: post.imageUrl ? 0 : "0.5rem" }}>
                      <div className={styles.captionText} style={{ marginBottom: "0.5rem" }}>
                        <div className="leading-relaxed text-(--color-heading) opacity-95">{post.caption}</div>
                      </div>
                    </div>

                    {post.postType === PostType.PLANT_SHARE && post.gardenPlant ? (
                      <div className={styles.shareImage}>
                        <CityImage
                          src={
                            post.imageUrl ||
                            post.gardenPlant.journalEntries?.[0]?.imageAsset?.publicUrl ||
                            post.gardenPlant.plantSpecies?.products?.[0]?.coverAsset?.publicUrl ||
                            "/images/placeholder-plant.png"
                          }
                          alt={post.gardenPlant.plantSpecies?.commonName}
                          sizes="100vw"
                          className="h-full w-full"
                        />
                        <div className={styles.shareOverlay}>
                          <div className={styles.shareTitle}>
                            {post.gardenPlant.nickname || post.gardenPlant.plantSpecies?.commonName}
                          </div>
                          <div className={styles.shareMeta}>
                            {post.gardenPlant.plantSpecies?.commonName} • Day {post.gardenPlant.daysGrowing}
                          </div>
                          <div className={styles.shareProgress}>
                            {Math.min(
                              100,
                              Math.round((post.gardenPlant.daysGrowing / getHarvestDays(post.gardenPlant)) * 100),
                            )}
                            % complete
                          </div>
                        </div>
                      </div>
                    ) : post.imageUrl ? (
                      <div className={styles.postImage}>
                        <CityImage src={post.imageUrl} alt={post.caption} sizes="100vw" className="h-full w-full" />
                      </div>
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
                        <div className={styles.actionItem} onClick={() => openComments(post)}>
                          <button
                            type="button"
                            className={styles.ghostButton}
                            style={{ padding: 0, minHeight: "auto", width: "auto" }}
                          >
                            <MessageIcon />
                          </button>
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
                            <div className={styles.viewComments} onClick={() => openComments(post)}>
                              View all {post.comments} comments
                            </div>
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

              {postType === "plant" ? (
                <>
                  <div className={styles.section}>
                    <div className={styles.sectionSubtitle}>Add a photo (Optional)</div>
                    <button
                      type="button"
                      className={styles.imagePlaceholder}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        backgroundImage: selectedImage ? `url(${selectedImage})` : "none",
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        minHeight: "100px",
                      }}
                    >
                      {!selectedImage ? (
                        <div className="flex flex-col items-center gap-2 text-[#37542d] opacity-50">
                          <ImageIcon />
                          <span className="text-sm font-bold">Tap to upload</span>
                        </div>
                      ) : null}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </button>
                  </div>
                  {gardenPlants.length > 0 && (
                    <PlantSharePicker currentPlantIndex={currentPlantIndex} plants={gardenPlants} onChange={setCurrentPlantIndex} />
                  )}
                </>
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

      {/* Comment Sheet Modal */}
      {activeCommentPost && (
        <div className={styles.commentSheetOverlay} onClick={() => setActiveCommentPost(null)}>
          <div className={styles.commentSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.commentSheetHeader}>
              <div className={styles.commentSheetTitle}>Comments ({activeCommentPost.comments})</div>
              <button type="button" onClick={() => setActiveCommentPost(null)} className={styles.iconButton}>
                <CloseIcon size={20} />
              </button>
            </div>

            <div className={styles.commentSheetBody}>
              {isCommentsLoading ? (
                <div className="flex h-32 items-center justify-center text-[#8a9687] text-sm italic">
                  Loading comments...
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {comments.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center opacity-60">
                      <MessageIcon size={32} style={{ marginBottom: "0.5rem" }} />
                      <div className="text-sm">Be the first to comment!</div>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id}>
                        <div className={styles.commentItemWrapper}>
                          <Avatar name={comment.user.username} size={32} />
                          <div className={styles.commentContent}>
                            <div className={styles.commentUserName}>{comment.user.username}</div>
                            <div className={styles.commentBodyText}>{comment.body}</div>
                            <div className={styles.commentMetaRow}>
                              <span>{formatDateTime(comment.createdAt)}</span>
                              <button 
                                className={styles.replyButton}
                                onClick={() => {
                                  setReplyingToId(comment.id);
                                  setNewCommentText(`@${comment.user.username} `);
                                }}
                              >
                                Reply
                              </button>
                              {user.id === comment.user.id && (
                                <button 
                                  className="text-[#dc2626] opacity-60 ml-2"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className={styles.repliesContainer}>
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className={styles.commentItemWrapper} style={{ marginBottom: "1rem" }}>
                                <Avatar name={reply.user.username} size={28} />
                                <div className={styles.commentContent}>
                                  <div className={styles.commentUserName} style={{ fontSize: "0.8rem" }}>{reply.user.username}</div>
                                  <div className={styles.commentBodyText} style={{ fontSize: "0.8rem" }}>{reply.body}</div>
                                  <div className={styles.commentMetaRow}>
                                    <span>{formatDateTime(reply.createdAt)}</span>
                                    {user.id === reply.user.id && (
                                      <button 
                                        className="text-[#dc2626] opacity-60 ml-2"
                                        onClick={() => handleDeleteComment(reply.id)}
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className={styles.commentComposerRow}>
              <div className={styles.commentInputWrapper}>
                <textarea
                  className={styles.commentInput}
                  placeholder={replyingToId ? `Replying...` : "Add a comment..."}
                  rows={1}
                  value={newCommentText}
                  onChange={(e) => {
                    setNewCommentText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateComment();
                    } else if (e.key === 'Escape' && replyingToId) {
                      setReplyingToId(null);
                      setNewCommentText("");
                    }
                  }}
                />
              </div>
              <button 
                className={styles.sendButton}
                onClick={handleCreateComment}
                disabled={!newCommentText.trim()}
                style={{ opacity: newCommentText.trim() ? 1 : 0.5 }}
              >
                <PlusIcon size={20} style={{ transform: "rotate(0deg)" }} />
              </button>
            </div>
          </div>
        </div>
      )}
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
