You are in a repository holding the code for Obsidian Slides Extended, a fork from the discontinued Obsidian Slides Advanced plugin.
The plugin allows for showing a preview of a Reveal.js slidedeck presentation that gets the currently open markdown note injected.
The plugins comes with several preinstalled themes.

I wanted to use the theme provided by our corporation. I have included that theme for reference in /references.
For the corporate theme, you modify a local slides.md, which is then injected into index.html, which loads the theme in /references/helmholtz-template.

I have tried getting this theme to work in Obsidian Slides Extended, but failed so far. I tried out all the options.
My observations:
* the settings are confusing, and it is unclear where I would need to put the different files of the plugin (assets such as images and fonts, css and js files)
* some of the resources currently dont seem to appear in the sources panel in Obsidian dev tools of the revealjs slide iframe
* Some of the settings in the src/template/reveal.html file (which is the entry point for the plugin to render the files, so the equivalent of /references/index.html) might be contradicting with my theme
* I dont know how to provide the plugin my helmholtz template plugin (references/helmholtz-template/js/helmholtz-ai-plugin.js)
* The styling seems to be off (centered etc.)

I would like you to thoroughly assess the plugin /src in its current state and my template.
Please review if I am able in the current state of the plugin to get my template working fully (including providing a plugin js file, specifically helmholtz-ai-plugin.js).
The template configured should look 100% the same as my template in /references. It is likely a good idea to check out the slidesExtended-SettingTab.ts containing all the settings of the app, then searching for settings in the files that might work.

Please generate a REPORT.md file at the end, providing information on
* whether it is possible to get this running in the current state of the plugin
* what files I would need to copy where specifically inside either .obsidian or (better) the assets directory specified in the settings
* any issues or bugs that are related that might prohibit this to work in the plugin
* how the plugin would need to be changed to make this work (if it currently wouldnt)
* how reveal.html might overwrite styling/settings for my plugin and what I would need to adjust.

---


We need to rework several parts of this plugin, implementing the following features:
* natively support per-slide YAML blocks. This should be achieved by:
  * splitting at `---` into slides (unchanged)
  * if there is a code yaml block right at the beginning of the slide, consider this slide-level properties
  * this allows for providing per slide layouts, images, etc.
  * this should not be a theme plugin specific feature, but done by Obsidian Slides Extended plugin, then provided to the plugin, which may use it to put content on slide or decide on a slide layout
* Plugins should natively be supported. Adding plugins should be possible in the settings
  * there already is a setting `Scripts` that lists `my-plugin.js, utils.js` as placeholder; however, this is not for Obsidian plugins, and these "plugins" simply get injected into the context
  * create a new `Plugins` setting, that allows for injecting plugins
  * be careful, as this might not work with a simple comma separated list, as the plugins have names, i.e. helmholtz-ai-plugin.js exports HelmholtzAIPlugin
  * if default exports are possible, you may circumvent this issue, otherwise this needs to be specified in the settings or parsed by this obsidian plugin before starting the revealjs presentation
* metadata is not necessary in the same way as the helmholtz-plugin does it. It would be much preferred if I can set these things in the frontmatter of the .md file, then use these in the slides (injection) and in the plugin (creating the footer containing the author etc).
* Make sure fonts are loadable

Remember, the ultimate goal is that I can provide the Obsidian Extended Plugin my template (i.e. in <vault>/_Templates/Reveal.js/helmholtz-ai). It would be great if I can group files (i.e. font, images, cs, js) per template, not all in the same assets folder (might require recursive search). It should allow me to create a slides.md file for obsidian that results in 100% the same styling as when serving references/index.html. Use TODO-items. Commit intermediate steps, so that there is a clear commit history, one commit per feature/todo item. (I have forked this repo, push to origin, not upstream)


[Annotations are not sufficient](https://github.com/MSzturc/obsidian-advanced-slides/commit/d6bcc58530ca988b929f15795c25bf629d0ac748)

