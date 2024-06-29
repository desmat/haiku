'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react';
import { IoAddCircle, IoHelpCircle, IoHeartSharp } from 'react-icons/io5';
import { FaShare, FaExpand, FaCopy } from "react-icons/fa";
import { BiLogoInstagramAlt } from "react-icons/bi";
import { RiTwitterFill } from "react-icons/ri";
import { HiSwitchVertical, } from "react-icons/hi";
import { MdHome, MdDelete, MdFacebook } from "react-icons/md";
import { BsDatabaseFillUp } from "react-icons/bs";
import { FaRandom } from "react-icons/fa";
import { RiImageFill, RiImageAddLine, RiImageEditLine, RiImageLine } from "react-icons/ri";
import useUser from '@/app/_hooks/user';
import { ExperienceMode } from '@/types/ExperienceMode';
import { Haiku } from '@/types/Haiku';
import { LanguageType, supportedLanguages } from '@/types/Languages';
import trackEvent from '@/utils/trackEvent';
import { StyledLayers } from '../StyledLayers';
import PopOnClick from '../PopOnClick';

function LinkGroup({
  icon,
  className,
  title,
  links,
}: {
  icon: any,
  className?: string,
  title?: string,
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
      className="_bg-pink-200 flex flex-row relative"
      onMouseOver={() => setLinksVisible(true)}
      onMouseOut={() => setLinksVisible(false)}
    >
      <div
        className={className}
        title={title}
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
  onShowAbout,
  onBackup,
  onCopyHaiku,
  onCopyLink,
  onLikeHaiku,
  onUploadImage,
  onUpdateImage,
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
  onSaveDailyHaiku: any,
  onShowAbout: any,
  onBackup?: any,
  onCopyHaiku?: any,
  onCopyLink?: any,
  onLikeHaiku?: any,
  onUploadImage?: any,
  onUpdateImage?: any,
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
            {user?.isAdmin && (haiku?.dailyHaikuId || haiku?.dailyHaikudleId || haiku.isIncorrect) &&
              <div className={`absolute top-[-0rem] right-[-0rem] rounded-full w-[0.6rem] h-[0.6rem] ${haiku.isIncorrect ? "bg-red-600" : "bg-blue-600"}`} />
            }
            <PopOnClick color={haiku?.bgColor}>
              <IoHelpCircle className="text-[2rem] md:text-[2.25rem]" />
            </PopOnClick>
          </div>
        }
        {!onShowAbout &&
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
        {/* {haikuMode && !user?.isAdmin &&
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
        } */}
        {haikuMode && !user?.isAdmin &&
          <Link
            key="facebook"
            href="https://www.facebook.com/limericksai"
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
        {/* {haikuMode && !user?.isAdmin &&
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
        } */}
        {/* <Link
          key="email"
          href={`mailto:haiku${mode == "haikudle" ? "dle" : ""}@desmat.ca`}
          target="_blank"
        >
          <MdMail className="text-[1.5rem] md:text-[1.75rem]" />
        </Link> */}
        {user?.isAdmin && haiku?.id && onLikeHaiku &&
          <StyledLayers
            styles={haiku.likedAt ? altStyles.slice(0, 1) : styles.slice(0, 0)}
          >
            <div
              key="heart"
              title={`${haiku.likedAt ? "Un-like this haiku" : "Like this haiku"} ${user?.isAdmin ? `(${haiku.numLikes} like${!haiku.numLikes || haiku.numLikes > 1 ? "s" : ""})` : ""}`}
              className="cursor-pointer relative"
              onClick={onLikeHaiku}
            >
              {user?.isAdmin && haiku?.numLikes > 0 &&
                <div className="absolute top-[-0.1rem] right-[-0.1rem] rounded-full w-[0.6rem] h-[0.6rem] bg-red-600" />
              }
              <PopOnClick color={haiku?.bgColor} >
                <IoHeartSharp className="text-[1.75rem] md:text-[2rem]" />
              </PopOnClick>
            </div>
          </StyledLayers>
        }
        {user?.isAdmin && (!haiku?.id || !onLikeHaiku) &&
          <div className="opacity-40">
            <IoHeartSharp className="text-[1.5rem] md:text-[1.75rem]" />
          </div>
        }
        {true && //user?.isAdmin &&
          <div
            key="copy"
            className={haiku?.id && onCopyHaiku ? "cursor-copy" : "opacity-40"}
            title="Copy haiku poem "
            onClick={() => {
              if (onCopyHaiku) {
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
              <FaCopy className="text-[1.5rem] md:text-[1.75rem]" />
            </PopOnClick>
          </div>
        }
        {haiku?.id && onCopyLink &&
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
                href={`/${haiku.id}`}
                title="Copy link to share"
                className="cursor-copy"
                onClick={(e: any) => {
                  e.preventDefault();
                  onCopyLink()
                }}
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
                  <FaShare className="text-[1.5rem] md:text-[1.75rem]" />
                </PopOnClick>
              </Link>
            </StyledLayers>
          </div>
        }
        {(!haiku?.id || !onCopyLink) &&
          <div className="opacity-40">
            <FaShare className="text-[1.5rem] md:text-[1.75rem]" />
          </div>
        }
        {user?.isAdmin &&
          <div
            key="refresh"
            className={haiku?.id && onRefresh ? "cursor-pointer" : "opacity-40"}
            onClick={() => haiku?.id && onRefresh && onRefresh()}
            title="Load random"
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onRefresh}>
              <FaRandom className="text-[1.5rem] md:text-[1.75rem]" />
            </PopOnClick>
          </div>
        }
        {user?.isAdmin && haiku?.bgImage &&
          <LinkGroup
            key="imageOptions"
            className={haiku?.id ? "cursor-pointer" : "opacity-40"}
            title="Image options"
            icon={
              <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
                <RiImageFill className="text-[1.75rem] md:text-[2rem]" />
              </PopOnClick>
            }
            links={[
              user?.isAdmin && haiku?.id &&
              <Link
                key="downloadImage"
                className={haiku?.id ? "cursor-pointer" : "opacity-40"}
                title="Download background image"
                href={haiku?.bgImage}
                target="_blank"
              >
                <PopOnClick color={haiku?.bgColor} disabled={!haiku?.bgImage}>
                  <RiImageLine className="text-[1.75rem] md:text-[2rem]" />
                </PopOnClick>
              </Link>,
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
                  <RiImageAddLine className="text-[1.75rem] md:text-[2rem]" />
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
                  <RiImageEditLine className="text-[1.75rem] md:text-[2rem]" />
                </PopOnClick>
              </div>,
            ]}
          />
        }
        {user?.isAdmin &&
          <div
            key="deleteHaiku"
            className={haiku?.id && onDelete ? "cursor-pointer" : "opacity-40"}
            onClick={() => haiku?.id && onDelete && onDelete()}
            title="Delete"
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onDelete}>
              <MdDelete className="text-[1.75rem] md:text-[2rem]" />
            </PopOnClick>
          </div>
        }
        {user?.isAdmin &&
          <div
            key="saveHaiku"
            className={haiku?.id && onSaveDailyHaiku ? "cursor-pointer" : "opacity-40"}
            onClick={haiku?.id && onSaveDailyHaiku && onSaveDailyHaiku}
            title={`Save as daily ${mode}`}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id}>
              <IoAddCircle className="text-[1.5rem] md:text-[1.75rem]" />
            </PopOnClick>

          </div>
        }
        {user?.isAdmin &&
          <div
            key="backup"
            onClick={() => !backupInProgress && onBackup && onBackup()}
            title={backupInProgress ? "Database backup in progress..." : "Backup database"}
            className={backupInProgress ? "_opacity-50 animate-pulse cursor-not-allowed" : onBackup ? "cursor-pointer" : "opacity-40"}
          >
            <PopOnClick color={haiku?.bgColor} disabled={backupInProgress || !haiku?.id || !onBackup}>
              <BsDatabaseFillUp className="text-[1.5rem] md:text-[1.75rem]" />
            </PopOnClick>
          </div>
        }
        {false && mode != "social-img" && user?.isAdmin && process.env.EXPERIENCE_MODE != "haikudle" &&
          <Link
            key="changeMode"
            href={`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : "haiku"}`}
            className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
            title="Switch between haiku/haikudle mode"
            onClick={async (e: any) => {
              e.preventDefault();
              haiku?.id && onSwitchMode && onSwitchMode();
              router.push(`/${haiku ? haiku?.id : ""}?mode=${mode == "haiku" ? "haikudle" : "haiku"}`);
            }}
          >
            <PopOnClick color={haiku?.bgColor} disabled={!haiku?.id || !onSwitchMode}>
              <HiSwitchVertical className="text-[1.75rem] md:text-[2rem]" />
            </PopOnClick>
          </Link>
        }
        {user?.isAdmin && process.env.EXPERIENCE_MODE != "haikudle" &&
          <Link
            key="socialImgMode"
            href={`/${haiku ? haiku?.id : ""}?mode=showcase`}
            className={haiku?.id && onSwitchMode ? "cursor-pointer" : "opacity-40"}
            title="Switch to showcase mode "
            onClick={(e: any) => {
              haiku?.id && onSwitchMode && onSwitchMode("showcase");
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
