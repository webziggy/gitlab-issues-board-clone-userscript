# gitlab-issues-board-clone-userscript
Javascript Userscript for browsers - allows creation of a list of columns based on labels in a gitlab issue board.

[Until Gitlab supports portability of Issue Board settings](https://gitlab.com/gitlab-org/gitlab/-/issues/4063) (better/at all) here's a simple hack in Userscripts style - in your browser use an extension like [TamperMonkey](https://www.tampermonkey.net/) to use it.

You will need to customise the script to your needs - you'll need to set up your labels (the string and the ID numbers). There's no GUI or UX component - to kick things off when you are set up, you need to use the console in your web browser of choice. I've only tested this with Firefox for my own needs - sorry, that's really basic testing and I should (and do) know better... but it was a quick hack to get things to work quickly.

Maybe someone would like to collaborate and fix it / tidy it up / make it cool. Until Gitlab themselves gives us a proper implementation.

It may, obviouly, break when they update the document object on the issue board pages - so it'll need nursing. :-)
