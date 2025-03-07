import { formatTimeFromNow } from "@desmat/utils/format";
import * as locale from 'locale-codes'
import { Haiku } from "./Haiku";

export type OnboardingStep = {
  focus?: string,
  message?: string,
  style?: any | undefined,
};

export const haikuOnboardingSteps = (haiku: Haiku) => [
  {
    focus: "",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with 5/7/5 syllable per line, traditionally evoking images of the natural world. Learn more <b><a href="https://en.wikipedia.org/wiki/Haiku" target="_blank">here</a></b>.</div>
        <div>I built this for haiku enthusiasts to make and share their creations, but also for me to have a bit of fun with <b><a href="https://en.wikipedia.org/wiki/Large_language_model" target="_blank">Large Language Models</a></b>.</div>
        <div>Hit the <b>✨</b> button at the top of screen to start crafting your own haiku and share it with the world!</div>
        <div>Follow the next steps to learn all about <b>Haiku Genius</b>.</div>
      </div>
    `,
    style: { bottom: 0 }
  },
  {
    focus: "poem",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>This haiku poem was created with the assistance of <b>ChatGPT</b>, with the imagery generated by <b>DALL-E</b> to blend with the poem.</div>
        <div>AI-generated content is often good, but sometimes less so! Haiku creators start with a generated poem, then their creativity takes over.</div>
      </div>
    `,
    style: haiku?.layout?.poem?.top || haiku?.layout?.poem?.up >= 10
      ? { bottom: 0 }
      : { top: 0 },
  },
  {
    focus: "generate",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>A new haiku will be featured every day, maybe one of yours! Click on the logo to see today's haiku, come back tomorrow for more.</div>
        <div>To create your own haiku hit the <b>✨</b> button at the top of the screen, maybe specify <b>theme or subject in any language</b> and AI will get you started. The rest is up to!</div>
      </div>
    `,
    style: { bottom: "50%", transform: "translateY(50%)" },
  },
  {
    focus: "side-panel-and-bottom-links",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>Find all your haikus in the side panel to the right.</div>
        <div>To learn <b>about me</b>, access Haiku Genius' social home, or <b>share</b> this haiku see the buttons at the bottom.</div>
        <div>For the best experience on mobile hit the <b>Add to Home Screen</b> under the <b>Share</b> or <b>three-dot menu icon</b>.</div>
        <div>Enjoy <b>Haiku Genius!</b></div>        
      </div>
    `,
    style: { bottom: "50%", transform: "translateY(50%)" },
  },
];

export const haikuGeneratedOnboardingSteps = (haiku: Haiku) => [
  {
    focus: "poem-actions",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>
          This haiku was${haiku?.version ? " initially" : ""} generated on the theme <i>${haiku?.theme}</i>${haiku?.mood ? ` with a <i>${haiku?.mood}</i> mood using <b>ChatGPT</b>` : ""}. 
          Both theme and mood were used to generate the art using <b>DALL-E</b> with a curated prompt to harmonize with the poem, with specific instructions: <i>${haiku.artStyle}</i>.
        </div>
        <div>Try the buttons next to the poem to <b>edit</b>, <b>align</b> or <b>regenerate</b> the poem or art. To edit your mouse, keyboard, arrow keys, Tab, Escape and Enter keys to <b>edit, cancel or save.</b></div>
        <div>Level up your creativity with AI! Save with empty or incomplete lines, or use "..." placeholders for <b>AI to fill in.</b>
      </div>`,
    style: haiku?.layout?.poem?.top || haiku?.layout?.poem?.up >= 10
      ? { bottom: 0 }
      : { top: 0 },
  },
];

export const haikuMultiLanguageSteps = (haiku: Haiku) => [
  {
    focus: "generate",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>
          🎉 Haiku Genius now support multi-language! 🎉
        </div>
        <div>To generate a haiku poem in any language, simply ask in the language you want, or specify the language directly.</div>
        <div>For example <i>Summer in Paris <b>in French</b></i>, <i>Lluvia de la mañana <b>en español</b></i>, <b>桜の花が咲く</b>, <b>शांतिपूर्ण नदी</b>, etc.</div>
      </div>`,
    style: { bottom: 0 },
  },
];

export const haikudleGotoHaikuGenius = (haiku: Haiku) => [
  {
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>Want more haiku poems without the puzzles?</div>
        <div><b><a href="https://haikugenius.ai/" target="_blank">Haiku Genius</a></b> features a daily haiku with beautiful generative art, a poem generator and editor, and access to the official social media pages so you won't miss a single one!</div>
      </div>`,
    style: { bottom: 0 },
  },
];

export const haikuPromptSteps = (haiku: Haiku) => [
  {
    focus: "poem",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div>Id: ${haiku.id}</div> 
        ${typeof (haiku.subject) == "string" ? `<div class="ellipsis-2" title="${haiku.subject}">Subject: <i>${haiku.subject}</i></div>` : ""}
        <div class="ellipsis-2" title="${haiku.theme} and ${haiku.mood}">Theme and mood: <i>${haiku.theme}</i> and <i>${haiku.mood}</i></div> 
        ${typeof (haiku.title) == "string" ? `<div class="ellipsis-2" title="${haiku.title}">Title: <i>${haiku.title}</i></div>` : ""} 
        ${typeof (haiku.season) == "string" ? `<div class="ellipsis-2" title="${haiku.season}">Season: <i>${haiku.season}</i></div>` : ""} 
        ${typeof (haiku.credits) == "string" ? `<div class="ellipsis-2" title="${haiku.credits}">Credits: <i>${haiku.credits}</i></div>` : ""} 
        <div class="ellipsis-2" title="${haiku.artStyle?.replaceAll('"', "'")}">Image style: <i>${haiku.artStyle || "N/A"}</i></div>      
        <div class="ellipsis-2" title="${haiku.poemPrompt?.replaceAll('"', "'") }">Poem prompt: <i>${haiku.poemPrompt || "N/A"}</i></div>
        <div class="ellipsis-2" title="${haiku.imagePrompt?.replaceAll('"', "'") }">Image prompt: <i>${haiku.imagePrompt || "N/A"}</i></div>
        ${haiku.version || haiku.deprecated || haiku.deprecatedAt
        ? `<div>Version: ${haiku.version}
            ${haiku.version
          ? ` <a href="/${haiku.id}?version=${haiku.version - 1}">(Load previous)</a>`
          : ""}
            ${haiku.deprecated || haiku.deprecatedAt
          ? ` <a href="/${haiku.id}">(Load current)</a>`
          : ""}</div>`
        : ""}    
        <div>Created by: user <a href="/${haiku.id}?user=${haiku.createdBy}">${haiku.createdBy}</a> ${formatTimeFromNow(haiku.createdAt || 0)}</div>      
        ${haiku.updatedBy ? `<div>Updated by: user ${haiku.updatedBy} ${formatTimeFromNow(haiku.updatedAt || 0)}</div>` : ""} 
        ${haiku.dailyHaikuId ? `<div>Daily haiku: ${haiku.dailyHaikuId}</div>` : ""} 
        ${haiku.dailyHaikudleId ? `<div>Daily haikudle: ${haiku.dailyHaikudleId}</div>` : ""} 
        ${haiku.isIncorrect ? `<div>Incorrect haiku: ${haiku.isIncorrect}</div>` : ""} 
        ${haiku.lang ? `<div>Language: ${locale.getByTag(haiku.lang)?.name} (${haiku.lang})</div>` : ""} 
        ${haiku.albumId ? `<div>Included in album: ${haiku.albumId}</div>` : ""} 
      </div>`,
    style: { bottom: "50%", transform: "translateY(50%)" },
  },
];

export const haikudleOnboardingSteps = [
  {
    focus: "",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div><b>Haiku</b>: a Japanese poetic form that consists of three lines, with 5/7/5 syllable per line, traditionally evoking images of the natural world. Learn more <b><a href="https://en.wikipedia.org/wiki/Haiku" target="_blank">here</a></b>.</div>
        <div><b>Wordle</b>: a word game with a single daily solution, with all players attempting to guess the same word. Learn more <b><a href="https://en.wikipedia.org/wiki/Wordle" target="_blank">here</a></b>.</div>
        <div>Unscramble the poem to solve today's haiku puzzle and reveal the art work!</div>
        <div>Want more haiku poems without the puzzles?</div>
        <div><b><a href="https://haikugenius.ai/" target="_blank">Haiku Genius</a></b> features a daily haiku with beautiful generative art, a poem generator and editor, and access to the official social media pages so you won't miss a single one!</div>
      </div>`,
    style: { bottom: "50%", transform: "translateY(50%)" },
  },
  {
    focus: "puzzle",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>The poem's words have been moved around and the art blurred. Different styling indicates which word is in the correct place.</div>
        <div>Drag-and-drop or swap (tap/click on one then another) words to their correct places and the art work will be revealed.</div>
        <div>Daily puzzles only last for the day: solve and share before time runs out!</div>
      </div>
    `,
    style: { bottom: 0 },
  },
  {
    focus: "generate",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>A new haiku puzzle will be featured every day. Click on the logo in the side panel to return to today's, and come back to tomorrow for a new puzzle!</div>
        <div>To create your very own haikus hit the <b>✨</b> button at the top of the screen and pick a theme or subject: AI will get you started writing a poem and will generate art work to match.</div>
      </div>
    `,
    style: { bottom: 0 },
  },
  {
    focus: "side-panel-and-bottom-links",
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>Find all your haikus (solved or created) in the side panel to the left.</div>
        <div>To show this message again, learn more about me or get a link to share this haiku see the buttons at the bottom of the screen.</div>
        <div>Enjoy <b>Haikudle!</b></div>        
      </div>
    `,
    style: { bottom: 0 },
  },
];

export const showcase_onboardedFirstTime = [
  {
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>This showcase mode displays today’s haiku in fullscreen with no distractions.</div>
        <div>Tap or click anywhere on the screen to return.</div>
      </div>`,
    style: { bottom: 0 },
  },
];

export const showcase_onboardedFirstTime_admin = [
  {
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>This showcase mode displays today's haiku in fullscreen with no distractions.</div>
        <div>Tap or click the haiku poem to load another at random, and on the left of the screen to return to editor mode.</div>
      </div>`,
    style: { bottom: 0 },
  },
];

export const showcase_notOnboardedFirstTime = (haiku: Haiku) => [
  {
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>This haiku poem and art were generated by OpenAI's ChatGPT and DALL-E AI models with the theme <i>${haiku?.theme}</i>${haiku?.artStyle ? ` and instructions <i>${haiku?.artStyle}</i> for the visuals` : ""}. Bookmark this page to enjoy a new haiku every day!</div>
        <div>For the best experience on mobile hit the <b>Add to Home Screen</b> under the <b>Share</b> or <b>three-dot menu icon</b>.</div>
        <div>Tap or click anywhere to switch to Haiku Genius editor mode.</div>
      </div>`,
    style: { bottom: 0 },
  },
];

export const notShowcase_notOnboardedFirstTime_onboardedShowcase = [
  {
    message: `
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>In this mode you can create, share and view previous haikus. Follow the next steps to learn more.</div>
        <div>Tap or click the haiku poem to return to Daily Haiku showcase mode.</div>
      </div>`,
    style: { bottom: 0 },
  },
];
