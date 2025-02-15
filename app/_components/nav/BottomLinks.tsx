'use client'

import { formatTimeFromNow } from '@desmat/utils/format';
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react';
import { BiLogoInstagramAlt, BiBookAdd } from "react-icons/bi";
import { BsDatabaseFillUp, BsDatabaseFillDown, BsDatabaseDown } from "react-icons/bs";
import { FaShare, FaExpand, FaCopy, FaArrowsAlt, FaRandom } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { HiSwitchVertical, } from "react-icons/hi";
import { IoAddCircle, IoHelpCircle, IoHeartSharp, IoHeartOutline, IoFlagSharp, IoEyeOutline, IoStatsChart, IoShareSocialOutline } from 'react-icons/io5';
import { MdHome, MdDelete, MdFacebook } from "react-icons/md";
import { PiUserSwitchBold } from "react-icons/pi";
import { RiTwitterFill, RiImageFill, RiImageAddLine, RiImageEditLine } from "react-icons/ri";
import { TbSocial } from 'react-icons/tb';
import { StyledLayers } from '@/app/_components/StyledLayers';
import PopOnClick from '@/app/_components//PopOnClick';
import useUser from '@/app/_hooks/user';
import { ExperienceMode } from '@/types/ExperienceMode';
import { Haiku } from '@/types/Haiku';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import trackEvent from '@/utils/trackEvent';

function LinkGroup({
  icon,
  className,
  title,
  disabled,
  onClick,
  links,
}: {
  icon: any,
  className?: string,
  title?: string,
  disabled?: boolean,
  onClick?: any,
  links: any[],
}) {
  const [linksVisible, setLinksVisible] = useState(false);

  // for testing
  // useEffect(() => {
  //   const interval = setInterval(() => setChildrenVisible(!childrenVisible), 1000);
  //   return () => clearInterval(interval);
  // })

  return (
    <div
      className={`_bg-pink-200 flex flex-row relative ${disabled ? "opacity-40" : "cursor-pointer"}`}
      onMouseOver={() => !disabled && setLinksVisible(true)}
      onMouseOut={() => !disabled && setLinksVisible(false)}
    >
      <div
        className={className}
        title={title}
        onClick={() => !disabled && onClick && onClick()}
      >
        {icon}
      </div>
      <div
        className={`_bg-yellow-200 flex flex-col gap-[0rem] absolute bottom-[-0rem] left-[0rem] p-[0rem]`}
        style={{
          display: linksVisible ? "block" : "none",
        }}
      >
        {links.filter(Boolean).map((link: any, i: number) => (
          <div
            key={i}
            className="_bg-orange-200 absolute left-[-0.2rem] bottom-0 px-[0.2rem] py-[0rem]"
            style={{
              // bottom: `${childrenVisible ? i * 1.7 : 0}rem`,
              transform: `translate(0%, -${linksVisible ? i * 100 + 100 : 0}%)`,
              // y no work?!
              transition: "transform 1s ease, bottom 1s ease",
            }}
          >
            {link}
          </div>
        ))}
      </div>
    </div>
  )
};

export default function BottomLinks({
  mode,
  haiku,
  lang,
  styles,
  altStyles,
  backupInProgress,
  onboardingElement,
  onRefresh,
  onSwitchMode,
  onDelete,
  onSaveDailyHaiku,
  onAddToAlbum,
  onShowAbout,
  onBackup,
  onCopyHaiku,
  onCopyLink,
  onLikeHaiku,
  onUploadImage,
  onUpdateImage,
  exitImpersonation,
  updateLayout,
}: {
  mode: ExperienceMode,
  haiku?: Haiku,
  lang?: LanguageType,
  styles?: any,
  altStyles?: any
  backupInProgress?: boolean,
  onboardingElement?: string | undefined,
  onRefresh: any,
  onSwitchMode: any,
  onDelete: any,
  onSaveDailyHaiku?: any,
  onAddToAlbum?: any,
  onShowAbout: any,
  onBackup?: any,
  onCopyHaiku?: any,
  onCopyLink?: any,
  onLikeHaiku?: any,
  onUploadImage?: any,
  onUpdateImage?: any,
  exitImpersonation?: any,
  updateLayout?: any,
}) {
  // console.log("BottomLinks", { lang, haiku })
  const router = useRouter();
  const user = useUser((state: any) => state.user);
  const fileInputRef = useRef();
  const haikuMode = mode == "haiku";
  const haikudleMode = mode == "haikudle";

  return (
    <div
      className="_bg-yellow-100 bottom-links relative flex flex-row gap-3 items-center justify-center _font-semibold"
    >
      <div
        className="relative flex flex-row gap-2 items-center justify-center _font-semibold"
      >
        {onShowAbout && (haikudleMode || user?.isAdmin) &&
          <div
            key="about"
            className="cursor-pointer relative"
            title="About"
            onClick={() => {
              trackEvent("clicked-about", {
                userId: user?.id,
                location: "bottom-links",
              });
              onShowAbout && onShowAbout();
            }}
          >
            {user?.isAdmin && (haiku?.dailyHaikuId || haiku?.dailyHaikudleId || haiku?.isIncorrect) &&
              <div className={`absolute top-[-0rem] right-[-0rem] rounded-full w-[0.6rem] h-[0.6rem] 
                ${haiku?.isIncorrect
                  ? "bg-red-600"
                  : haiku?.dailyHaikuId && haiku?.dailyHaikudleId
                    ? "bg-purple-600"
                    : haiku?.dailyHaikuId
                      ? "bg-blue-600"
                      : "bg-green-600"
                }`}
              />
            }
            <PopOnClick color={haiku?.bgColor}>
              <IoHelpCircle className="text-[2rem] md:text-[2.25rem]" />
            </PopOnClick>
          </div>
        }
        {!onShowAbout && (haikudleMode || user?.isAdmin) &&
          <div className="opacity-40">
            <IoHelpCircle className="text-[2rem] md:text-[2.25rem]" />
          </div>
        }
        {/* <Link
          key="github"
          href="https://github.com/desmat/haiku"
          target="_blank"
          onClick={() => {
            trackEvent("clicked-github", {
              userId: user?.id,
              location: "bottom-links",
            });
          }}
        >
          <PopOnClick color={haiku?.bgColor}>
            <IoLogoGithub className="text-[1.5rem] md:text-[1.75rem]" />
          </PopOnClick>
        </Link> */}
        {user?.impersonating &&
          <StyledLayers styles={altStyles.slice(0, 1)} >
            <div
              key="impersonating"
              className="cursor-pointer"
              title={`Impersonating user ${user.id}: click to exit`}
              onClick={exitImpersonation}
            >
              <PopOnClick >
                <PiUserSwitchBold className="text-[2rem] md:text-[2.25rem]" />
              </PopOnClick>
            </div>
          </StyledLayers>
        }
        {!user?.isAdmin &&
          <Link
            key="web"
            href="https://www.desmat.ca"
            target="_blank"
            onClick={() => {
              trackEvent("clicked-web", {
                userId: user?.id,
                location: "bottom-links",
              });
            }}
          >
            <PopOnClick color={haiku?.bgColor}>
              <MdHome className="text-[2rem] md:text-[2.25rem]" />
            </PopOnClick>
          </Link>
        }
        {haikuMode && !user?.isAdmin &&
          <Link
            key="twitter"
            href="https://x.com/haiku_genius"
            target="_blank"
            onClick={() => {
              trackEvent("clicked-twitter", {
                userId: user?.id,
                location: "bottom-links",
              });
            }}
          >
            <PopOnClick color={haiku?.bgColor}>
              <RiTwitterFill className="text-[2rem] md:text-[2.25rem]" />
            </PopOnClick>
          </Link>
        }
        {haikuMode && !user?.isAdmin &&
          <Link
            key="facebook"
            href="https://www.facebook.com/haikugenius"
            target="_blank"
            onClick={() => {
              trackEvent("clicked-facebook", {
                userId: user?.id,
                location: "bottom-links",
              });
            }}
          >
            <PopOnClick color={haiku?.bgColor}>
              <MdFacebook className="text-[2rem] md:text-[2.25rem]" />
            </PopOnClick>
          </Link>
        }
        {haikuMode && !user?.isAdmin &&
          <Link
            key="instagram"
            href="https://www.instagram.com/haiku_genius/"
            target="_blank"
            onClick={() => {
              trackEvent("clicked-instagram", {
                userId: user?.id,
                location: "bottom-links",
              });
            }}
          >
            <PopOnClick color={haiku?.bgColor}>
              <BiLogoInstagramAlt className="text-[2rem] md:text-[2.25rem]" />
            </PopOnClick>
          </Link>
        }
        {/* <Link
          key="email"
          href={`mailto:haiku${mode == "haikudle" ? "dle" : ""}@desmat.ca`}
          target="_blank"
        >
          <MdMail className="text-[1.5rem] md:text-[1.75rem]" />
        </Link> */}
        {user?.isAdmin &&
          <LinkGroup
            key="flagOptions"
            title="Flag"
            disabled={!haiku?.bgImage}
            icon={
              <StyledLayers
                styles={haiku?.likedAt ? altStyles.slice(0, 1) : styles.slice(0, 0)}
              >
                <div
                  key="heart"
                  title={`${haiku?.likedAt ? "Un-like this haiku" : "Like this haiku"} ${user?.isAdmin ? `(${haiku?.numLikes} like${!haiku?.numLikes || haiku?.numLikes > 1 ? "s" : ""})` : ""}`}
                  className={haiku?.id && onLikeHaiku ? "cursor-pointer relative" : "relative opacity-40"}
                  onClick={(e: any) => haiku?.id && onLikeHaiku && onLikeHaiku(haiku?.likedAt ? "un-like" : "like")}
                >
                  {user?.isAdmin && haiku?.numLikes > 0 && !(haiku?.numFlags || haiku?.userFlaggedAt) &&
                    <div className="absolute top-[-0.1rem] right-[-0.1rem] rounded-full w-[0.5rem] h-[0.5rem] bg-blue-600" />
                  }
                  {user?.isAdmin && (haiku?.numFlags || haiku?.userFlaggedAt) &&
                    <div className="absolute top-[-0.1rem] right-[-0.1rem] rounded-full w-[0.5rem] h-[0.5rem] bg-red-600" />
                  }
                  <PopOnClick color={haiku?.bgColor} disabled={!(haiku?.id && onLikeHaiku)}>
                    <IoHeartSharp className="text-[1.75rem] md:text-[2rem]" />
                  </PopOnClick>
                </div>
              </StyledLayers>
            }
            links={[
              <StyledLayers
                styles={haiku?.flaggedAt ? altStyles.slice(0, 1) : styles.slice(0, 0)}
              >
                <div
                  key="flag"
                  title={`${haiku?.userFlaggedAt ? `This haiku's author was flagged ${formatTimeFromNow(haiku.userFlaggedAt || 0)}` : haiku?.flaggedAt ? "Un-flag this haiku" : "Flag this haiku"} ${user?.isAdmin ? `(flagged ${haiku?.numFlags} time${!haiku?.numFlags || haiku?.numFlags > 1 ? "s" : ""})` : ""}`}
                  className={haiku?.id && onLikeHaiku ? "cursor-pointer relative" : "relative opacity-40"}
                  onClick={(e: any) => haiku?.id && onLikeHaiku && onLikeHaiku(haiku?.flaggedAt ? "un-flag" : "flag")}
                >
                  {user?.isAdmin && (haiku?.numFlags || haiku?.userFlaggedAt) &&
                    <div className="absolute top-[-0.1rem] right-[-0.1rem] rounded-full w-[0.5rem] h-[0.5rem] bg-red-600" />
                  }
                  <PopOnClick color={haiku?.bgColor} disabled={!(haiku?.id && onLikeHaiku)}>
                    <IoFlagSharp className="text-[1.5rem] md:text-[1.75rem] p-[0.1rem] mb-[0.15rem] ml-[0.1rem]" />
                  </PopOnClick>
                </div>
              </StyledLayers>
            ]}
          />
        }
        {!user?.isAdmin &&
          <div
            key="copy"
            className={haiku?.id && onCopyHaiku ? "cursor-copy" : "opacity-40"}
            title="Copy haiku poem "
            onClick={() => {
              if (onCopyHaiku) {
                onCopyHaiku();
              }
            }}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onCopyHaiku}>
              <FaCopy className="text-[1.5rem] md:text-[1.75rem]" />
            </PopOnClick>
          </div>
        }
        {!user?.isAdmin &&
          <div className="onboarding-container">
            {onboardingElement == "bottom-links-share" &&
              <div className="onboarding-focus" />
            }
            <StyledLayers
              styles={styles}
              disabled={onboardingElement != "bottom-links-share"}
            >
              <Link
                key="link"
                href={`/${haiku?.id}`}
                title="Copy link to share"
                className={haiku?.id && onCopyLink ? "cursor-copy" : "opacity-40"}
                onClick={(e: any) => {
                  e.preventDefault();
                  haiku?.id && onCopyLink && onCopyLink()
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onCopyLink}>
                  <FaShare className="text-[1.5rem] md:text-[1.75rem]" />
                </PopOnClick>
              </Link>
            </StyledLayers>
          </div>
        }
        {user?.isAdmin &&
          <LinkGroup
            key="share"
            className={haiku?.id ? "cursor-pointer" : "opacity-40"}
            title="Share"
            icon={
              <Link
                key="link"
                href={`/${haiku?.id}`}
                title="Copy link to share"
                className={haiku?.id && onCopyLink ? "cursor-copy" : "opacity-40"}
                onClick={(e: any) => {
                  e.preventDefault();
                  haiku?.id && onCopyLink && onCopyLink()
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onCopyLink}>
                  <FaShare className="text-[1.5rem] md:text-[1.75rem] p-[0.1rem]" />
                </PopOnClick>
              </Link>
            }
            links={[
              // <Link
              //   key="link"
              //   href={`/${haiku?.id}`}
              //   title="Copy link to share"
              //   className={haiku?.id && onCopyLink ? "cursor-copy" : "opacity-40"}
              //   onClick={(e: any) => {
              //     e.preventDefault();
              //     haiku?.id && onCopyLink && onCopyLink()
              //   }}
              // >
              //   <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onCopyLink}>
              //     <FaLink className="text-[1.5rem] md:text-[1.75rem] p-[0.2rem]" />
              //   </PopOnClick>
              // </Link>,
              <div
                key="copy"
                className={haiku?.id && onCopyHaiku ? "cursor-copy" : "opacity-40"}
                title="Copy haiku poem"
                onClick={() => {
                  if (haiku?.id && onCopyHaiku) {
                    trackEvent("haiku-copied", {
                      userId: user?.id,
                      id: haiku.id,
                      location: "bottom-links",
                    });
                    onCopyHaiku();
                  }
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onCopyHaiku}>
                  <FaCopy className="text-[1.5rem] md:text-[1.75rem] p-[0.2rem] ml-[-0.1rem]" />
                </PopOnClick>
              </div>,
            ]}
          />
        }
        {user?.isAdmin &&
          <LinkGroup
            key="randomOptions"
            title="Load random"
            disabled={!haiku?.id || !onRefresh}
            onClick={() => haiku?.id && onRefresh && onRefresh({ flagged: false })}
            icon={
              <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
                <FaRandom className="text-[1.5rem] md:text-[1.75rem]" />
              </PopOnClick>
            }
            links={[
              <div
                key="random-liked"
                className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
                onClick={() => haiku?.id && onRefresh && onRefresh({ liked: true })}
                title="Load random (not liked or flagged)"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
                  <IoHeartSharp className="text-[1.5rem] md:text-[1.75rem] p-[0.1rem]" />
                </PopOnClick>
              </div>,
              <div
                key="random-notliked"
                className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
                onClick={() => haiku?.id && onRefresh && onRefresh({ liked: false })}
                title="Load random (not liked or flagged)"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
                  <IoHeartOutline className="text-[1.5rem] md:text-[1.75rem] p-[0.05rem]" />
                </PopOnClick>
              </div>,
              // <div
              //   key="random-seen"
              //   className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
              //   onClick={() => haiku?.id && onRefresh && onRefresh({ seen: true })}
              //   title="Load random (not liked or flagged)"
              // >
              //   <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
              //     <IoEyeSharp className="text-[1.5rem] md:text-[1.75rem] p-[0.05rem]" />
              //   </PopOnClick>
              // </div>,
              <div
                key="random-notseen"
                className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
                onClick={() => haiku?.id && onRefresh && onRefresh({ seen: false, flagged: false, liked: false })}
                title="Load random (not liked or flagged)"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
                  <IoEyeOutline className="text-[1.5rem] md:text-[1.75rem] p-[0.05rem]" />
                </PopOnClick>
              </div>,
              <div
                key="random-flagged"
                className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
                onClick={() => haiku?.id && onRefresh && onRefresh({ flagged: true })}
                title="Load random (not liked or flagged)"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
                  <IoFlagSharp className="text-[1.5rem] md:text-[1.75rem] p-[0.05rem]" />
                </PopOnClick>
              </div>,
              // <div
              //   key="random-notflagged"
              //   className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
              //   onClick={() => haiku?.id && onRefresh && onRefresh({ flagged: false })}
              //   title="Load random (not liked or flagged)"
              // >
              //   <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
              //     <IoFlagOutline className="text-[1.5rem] md:text-[1.75rem]" />
              //   </PopOnClick>
              // </div>,              
            ]}
          />
        }
        {user?.isAdmin && haiku?.id &&
          <LinkGroup
            key="imageOptions"
            title="Image options"
            disabled={!haiku?.bgImage}
            icon={
              <Link
                key="downloadImage"
                title="Download background image"
                href={haiku?.bgImage}
                target="_blank"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.bgImage}>
                  <RiImageFill className="text-[1.75rem] md:text-[2rem]" />
                </PopOnClick>
              </Link>
            }
            links={[
              user?.isAdmin && haiku?.id && onUploadImage &&
              <div
                key="uploadImage"
                className="cursor-pointer"
                title="Upload background image"
                onClick={() => {
                  //@ts-ignore
                  fileInputRef?.current && fileInputRef.current.click();
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onUploadImage}>
                  <RiImageAddLine className="text-[1.75rem] md:text-[2rem] p-[0.05rem]" />
                </PopOnClick>
                <input
                  //@ts-ignore
                  ref={fileInputRef}
                  type="file"
                  name="file"
                  accept="image/png, image/jpg, image/jpeg, image/gif, image/svg"
                  className="hidden"
                  onInput={(e: any) => {
                    //@ts-ignore
                    fileInputRef?.current?.files && onUploadImage(fileInputRef?.current?.files[0]);
                  }}
                />
              </div>,
              user?.isAdmin && haiku?.id && onUpdateImage &&
              <div
                key="uploadImageUrl"
                className="cursor-pointer"
                title="Update background image from URL"
                onClick={onUpdateImage}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onUpdateImage}>
                  <RiImageEditLine className="text-[1.75rem] md:text-[2rem] p-[0.1rem]" />
                </PopOnClick>
              </div>,
            ]}
          />
        }
        {user?.isAdmin &&
          <LinkGroup
            key="addOptions"
            title={`Save as daily ${mode}`}
            disabled={!haiku?.id}
            onClick={haiku?.id && onSaveDailyHaiku && onSaveDailyHaiku}
            icon={
              <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
                <IoAddCircle className="text-[1.5rem] md:text-[1.75rem]" />
              </PopOnClick>
            }
            links={[
              <div
                key="addAlbum"
                className={haiku?.id ? "cursor-pointer" : "opacity-40"}
                onClick={() => haiku?.id && onAddToAlbum && onAddToAlbum()}
                title="Add to album"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
                  <BiBookAdd className="text-[1.5rem] md:text-[1.75rem]" />
                </PopOnClick>
              </div>,
            ]}
          />
        }
        {user?.isAdmin &&
          <LinkGroup
            key="options"
            title={backupInProgress ? "Database backup in progress..." : "Configs"}
            disabled={!haiku?.bgImage || backupInProgress || !onBackup}
            className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
            icon={
              <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
                <FaGear className="text-[1.5rem] md:text-[1.75rem] p-[0.1rem]" />
              </PopOnClick>
            }
            links={[
              <div
                key="backupHaiku"
                onClick={() => !backupInProgress && onBackup && onBackup("backupHaiku")}
                title={backupInProgress ? "Database backup in progress..." : "Backup specific haiku"}
                className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
              >
                <PopOnClick color={haiku?.bgColor} disabled={backupInProgress || !haiku?.id || !onBackup}>
                  <BsDatabaseDown className="text-[1.5rem] md:text-[1.75rem] p-[0.05rem]" />
                </PopOnClick>
              </div>,
              <div
                key="backupEntity"
                onClick={() => !backupInProgress && onBackup && onBackup("backup")}
                title={backupInProgress ? "Database backup in progress..." : "Backup database"}
                className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
              >
                <PopOnClick color={haiku?.bgColor} disabled={backupInProgress || !haiku?.id || !onBackup}>
                  <BsDatabaseFillDown className="text-[1.5rem] md:text-[1.75rem] p-[0.1rem]" />
                </PopOnClick>
              </div>,
              <div
                key="restore"
                onClick={() => !backupInProgress && onBackup && onBackup("restore")}
                title={backupInProgress ? "Database backup in progress..." : "Restore database"}
                className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
              >
                <PopOnClick color={haiku?.bgColor} disabled={backupInProgress || !haiku?.id || !onBackup}>
                  <BsDatabaseFillUp className="text-[1.5rem] md:text-[1.75rem] p-[0.1rem]" />
                </PopOnClick>
              </div>,
              <div
                key="stats"
                onClick={() => !backupInProgress && onBackup && onBackup("stats")}
                title={backupInProgress ? "Database backup in progress..." : "Get stats"}
                className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
              >
                <PopOnClick color={haiku?.bgColor} disabled={backupInProgress || !haiku?.id || !onBackup}>
                  <IoStatsChart className="text-[1.5rem] md:text-[1.75rem]" />
                </PopOnClick>
              </div>,
              <div
                key="deleteHaiku"
                className={haiku?.id && onDelete ? "cursor-pointer" : "opacity-40"}
                onClick={() => haiku?.id && onDelete && onDelete()}
                title="Delete"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onDelete}>
                  <MdDelete className="text-[1.5rem] md:text-[1.75rem]" />
                </PopOnClick>
              </div>,
              <div
                key="alignHaiku"
                className={haiku?.id && onDelete ? "cursor-pointer" : "opacity-40"}
                onClick={(e: any) => haiku?.id && updateLayout && updateLayout()}
                title="Align poem"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onDelete}>
                  <FaArrowsAlt className="text-[1.5rem] md:text-[1.75rem] p-[0.15rem]" />
                </PopOnClick>
              </div>,
            ]}
          />
        }
        {mode != "social-img" && haiku?.id && user?.isAdmin && process.env.EXPERIENCE_MODE != "haikudle" &&
          <LinkGroup
            key="modes"
            className={haiku?.id ? "cursor-pointer" : "opacity-40"}
            title="Switch mode"
            icon={
              <div
                key="changeMode"
                className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
                title="Switch between haiku/haikudle mode"
                onClick={async (e: any) => {
                  e.preventDefault();
                  haiku?.id && onSwitchMode && onSwitchMode(mode == "haikudle" ? "haiku" : "haikudle");
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
                  <HiSwitchVertical className="text-[1.75rem] md:text-[2rem]" />
                </PopOnClick>
              </div>
            }
            links={[
              <Link
                key="socialImgMode"
                href={`/${haiku ? haiku?.id : ""}?mode=social-img`}
                className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
                title="Switch to social-img mode"
                onClick={(e: any) => {
                  haiku?.id && onSwitchMode && onSwitchMode("social-img");
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
                  <TbSocial className="text-[1.75rem] md:text-[2rem] p-[0.1rem]" />
                </PopOnClick>
              </Link>,
              <Link
                key="haikudleSocialImgMode"
                href={`/${haiku ? haiku?.id : ""}?mode=haikudle-social-img`}
                className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
                title="Switch to haikudle-social-img mode"
                onClick={(e: any) => {
                  haiku?.id && onSwitchMode && onSwitchMode("haikudle-social-img");
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
                  <IoShareSocialOutline className="text-[1.75rem] md:text-[2rem] p-[0.1rem]" />
                </PopOnClick>
              </Link>,
            ]}
          />
        }
        {user?.isAdmin && process.env.EXPERIENCE_MODE != "haikudle" &&
          <Link
            key="socialImgMode"
            href={`/${haiku ? haiku?.id : ""}?mode=showcase`}
            className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
            title="Switch to showcase mode "
            onClick={(e: any) => {
              haiku?.id && onSwitchMode && onSwitchMode(mode != "haiku" ? "haiku" : "showcase");
            }}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
              <FaExpand className="text-[1.5rem] md:text-[1.75rem]" />
            </PopOnClick>
          </Link>
        }
      </div>
      {
        mode == "haiku" &&
        Object.entries(supportedLanguages)
          .filter((e: any) => (!lang && e[0] != "en") || (lang && lang != e[0]))
          .map(([k, v]: any) => (
            <Link
              key={k}
              href={`/${k != "en" ? `?lang=${k}` : ""}`}
            >
              <PopOnClick color={haiku?.bgColor}>
                {v.nativeName}
              </PopOnClick>
            </Link>
          ))
      }
    </div >
  )
}
