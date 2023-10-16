// ==UserScript==
// @name         Create Boards - Gitlab
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Create some columns in a gitlab issue board
// @website      https://github.com/webziggy/gitlab-issues-board-clone-userscript
// @source       https://github.com/webziggy/gitlab-issues-board-clone-userscript
// @author       You
// @match        *://*/groups/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // You may need to adjust the match ^^ above - I've made it generic to match if the first part of the path
    // is '.../groups/...' - but depending on your set up you might need to adjust so the script loads.
    // https://www.tampermonkey.net/documentation.php?locale=en#meta:match

    // How to use - load your issue board and make sure this Userscript loads. Then in the Javascript console
    // call "startCreateBoardColumns()" - and then it should slowly create the board columns based on the labels
    // you specify below.
    // This script ***WILL DO NOTHING*** until "startCreateBoardColumns()" is called from the web browser's console!
    // I probably should create a nice UI component that renders in the web page, or wait for a keystroke, but
    // this way it's fairly simple... and you need to modify this script anyway to make sure it's using your labels!

    // Until Gitlab finishes work on https://gitlab.com/gitlab-org/gitlab/-/issues/4063 - to allow clone of boards.

    // Other things to customise:
    //
    // The following Mappings arrays should be updated - the 'colmunsToCreate' array powers this script
    // the strings that are pushed should match your exact label names.
    //
    // Then the 'labelids' array is simply a lookup of the label names and their URI used in the interface
    // to find the number of the ID (as I don't think the rest of the URI actually changes, if you are on
    // GroupLabel level for your labels) can be found in the appropriate label management page within Gitlab.

    // /*** Mappings

    var columnsToCreate = [];
    columnsToCreate.push("status::Backlog");
    columnsToCreate.push("status::To Do");
    columnsToCreate.push("status::On Hold");
    columnsToCreate.push("status::Doing");
    columnsToCreate.push("status::To Be Tested");
    columnsToCreate.push("status::Testing");
    columnsToCreate.push("status::Pending Deployment");
    columnsToCreate.push("status::Completed");
    columnsToCreate.push("status::Closed");

    var labelids = [];
    labelids["status::Backlog"] = "listbox-item-gid://gitlab/GroupLabel/67";
    labelids["status::To Do"] = "listbox-item-gid://gitlab/GroupLabel/68";
    labelids["status::On Hold"] = "listbox-item-gid://gitlab/GroupLabel/70";
    labelids["status::Doing"] = "listbox-item-gid://gitlab/GroupLabel/69";
    labelids["status::To Be Tested"] = "listbox-item-gid://gitlab/GroupLabel/71";
    labelids["status::Testing"] = "listbox-item-gid://gitlab/GroupLabel/72";
    labelids["status::Pending Deployment"] = "listbox-item-gid://gitlab/GroupLabel/73";
    labelids["status::Completed"] = "listbox-item-gid://gitlab/GroupLabel/74";
    labelids["status::Closed"] = "listbox-item-gid://gitlab/GroupLabel/75";

    // Mappings ***/

    // /*** Delays
    //
    // So there's a bit of fine tuning, depending on how responsive your Gitlab instance is,
    // and your internet connection from your web browser. Sorry, but I've not had time to run more
    // checks and make it less 'brittle'. I was experimenting with 'waitForElm' which is supposed to wait
    // until some element is loaded (given a selector string). But I'm not convinced.
    //
    // So you may need to change the following delays - all measured in ms
    //

    const delaystart = 3000; // wait for this long before actually starting to create lists/columns.

    const delaybetweenColumnCreation = 3000; // wait for this long between list/column creation - this is usually about the delay loading other things on the screen.

    const delayLabelSelection = 500; // wait for this long when we are selecting the label in the ajax query that populates the dropdown for the lookahead

    // Delays ***/

    // You shouldn't need to edit anything below here.

    console.log("Userscript loaded");

    // This function is no longer used, but I'll keep it here in case anyone wants to use it, it's slightly
    // improved version of waiting for load of the page. So you could use this to fire off some code
    // when the page has loaded.

    function whenready(callback)
    {
        // in case the document is already rendered
        if (document.readyState!='loading') callback();
        // modern browsers
        else if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', callback);
        }
        // IE <= 8
        else {
            document.attachEvent('onreadystatechange', function(){
                if (document.readyState=='complete') callback();
            });
        }
    }

    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function createList(columnLabel)
    {
        console.log ("createList called with: "+columnLabel);
        // Click the Create list button
        document.querySelector('div[data-testid="boards-create-list"]').childNodes[0].click();

        // Click the 'label' radio button on the 'new list' panel that appear
        var elm = await waitForElm('div[data-testid="board-add-new-column"]');
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('input[type="radio"][value="label"]').click();

        // Now click the 'select label' dropdown.
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('div[data-testid="base-dropdown-toggle"]').childNodes[0].click();

        // Find then focus the label search field...
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('input[aria-label="Search labels"]').select();
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('input[aria-label="Search labels"]').value = "";
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('input[aria-label="Search labels"]').value = ""+columnLabel;
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('input[aria-label="Search labels"]').select();

        //might need to pause for 500ms here because the list might not populate quickly
        await sleep(delayLabelSelection);

        // Find the label in the resulting filtered select list and click it...
        document.querySelector('div[data-testid="board-add-new-column"]').querySelector('li[data-testid="'+labelids[""+columnLabel]+'"]').click();

        // Now click the Add to board button
        document.querySelector('button[data-testid="addNewColumnButton"]').click();

    }


    async function createBoardColumns()
    {
        await sleep(delaystart);
        for (var columnLabel of columnsToCreate)
        {
            createList(columnLabel);
            await sleep(delaybetweenColumnCreation);
        };
    };

    window.startCreateBoardColumns = function () {
        createBoardColumns();
    };

})();