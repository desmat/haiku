
import moment from 'moment';
import { NavOverlay } from '@/app/_components/Nav';
import HaikuPage from '@/app/_components/HaikuPage';
import { LanguageType } from '@/types/Languages';
import { getDailyHaiku, getHaiku } from '@/services/haikus';
import { Haiku } from '@/types/Haiku';

export default async function MainServerSidePage({ haiku, mode, id, lang, refreshDelay }: { haiku: Haiku, mode: string, id?: string, lang?: undefined | LanguageType, refreshDelay?: number }) {
  console.log('>> app.MainServerSidePage.render()', { mode, id, lang, haiku });

  const isHaikuMode = mode == "haiku";
  const isHaikudleMode = mode == "haikudle";
  const isShowcaseMode = mode == "showcase";

  // console.log('>> app.MainServerSidePage.render()', { haikuId });

  // TODO load user
  // const getTodaysHaiku = async () => {
  //   const todaysDateCode = moment().format("YYYYMMDD");
  //   const todaysHaiku = await getDailyHaiku(todaysDateCode);
  //   if (todaysHaiku?.haikuId) {
  //     return getHaiku(todaysHaiku?.haikuId);
  //   }
  // }

  // const haiku = id 
  // ? await getHaiku(id)
  // : await getTodaysHaiku()
  const fontColor = haiku?.color || "#555555";
  const bgColor = haiku?.bgColor || "lightgrey";

  const textStyles = [
    {
      color: fontColor,
      bgColor,
      filter: `drop-shadow(0px 0px 8px ${bgColor})`,
      WebkitTextStroke: `1px ${fontColor}`,
      fontWeight: 300,
    },
    {
      filter: `drop-shadow(0px 0px 2px ${bgColor})`,
    },
    {
      filter: `drop-shadow(0px 0px 4px ${bgColor}99)`,
    },
    {
      filter: `drop-shadow(0px 0px 8px ${bgColor}66)`,
    },
    {
      filter: `drop-shadow(0px 0px 12px ${bgColor}33)`,
    },
    {
      filter: `drop-shadow(0px 0px 18px ${bgColor}22)`,
    },
  ];

  const altTextStyles = [
    {
      color: bgColor,
      filter: `drop-shadow(0px 0px 3px ${fontColor})`,
      WebkitTextStroke: `0.5px ${bgColor}`,
      fontWeight: 300,
    },
    {
      filter: `drop-shadow(0px 0px 1px ${fontColor})`,
    },
    {
      filter: `drop-shadow(0px 0px 8px ${bgColor}55)`,
    },
    {
      filter: `drop-shadow(0px 0px 12px ${bgColor}33)`,
    },
    {
      filter: `drop-shadow(0px 0px 18px ${bgColor}11)`,
    },
  ];

  return (
    <div>
      <NavOverlay
        mode={mode}
        lang={lang}
        haiku={haiku}
        // refreshDelay={_refreshDelay}
        // backupInProgress={backupInProgress}
        styles={textStyles.slice(0, textStyles.length - 3)}
        altStyles={altTextStyles}
      // onClickLogo={doRefresh}
      // onClickGenerate={startGenerateHaiku}
      // onSwitchMode={switchMode}
      // onDelete={doDelete}
      // onSaveHaikudle={doSaveHaikudle}
      // onShowAbout={userGeneratedHaiku
      //   ? showAboutGenerated
      //   : previousDailyHaikudleId
      //     ? showAboutPreviousDaily
      //     : showAbout
      // }
      // onSelectHaiku={selectHaiku}
      // onChangeRefreshDelay={changeRefreshDelay}
      // onBackup={startBackup}
      />

      <HaikuPage
        mode={mode}
        haiku={haiku}
        styles={textStyles}
        altStyles={altTextStyles}
      // popPoem={isHaikudleMode && haikudleSolvedJustNow}
      // regenerateHaiku={() => ["haiku", "haikudle"].includes(mode) && (user?.isAdmin || haiku?.createdBy == user?.id) && startRegenerateHaiku && startRegenerateHaiku()}
      // regenerating={regenerating}
      // refresh={doRefresh}
      />
    </div>
  )
}
