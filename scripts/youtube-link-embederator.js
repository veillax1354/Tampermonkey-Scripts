// ==UserScript==
// @name         Add download URL to YouTube Embed iFrames
// @namespace    http://tampermonkey.net/
// @version      2024-05-23
// @description  Add download URL to YouTube Embed iFrames
// @author       Veillax & TheDerpyDude
// @match        https://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() { 'use strict'; let debug = false;

    function isYoutubeEmbed(iframe) {
        const src = iframe.src;
        return src.includes("youtube.com/embed") || src.includes("youtube-nocookie.com/embed/");
    }

    // Loop through all iframes and check for failed YouTube embeds
    const head = document.querySelector("head");
    const style = document.createElement("style");
    const css = '.youtube-embed {position: none; !important}';
    style.textContent = css;
    head.appendChild(style);
    const iframes = document.querySelectorAll("iframe");
    for (const iframe of iframes) {
        if (isYoutubeEmbed(iframe)) {
            // Create a div element
            const div = document.createElement("div");

            // Set the div's class to "youtube-embed"
            div.classList.add("youtube-embed");

            // Wrap the iframe with the div
            iframe.parentNode.insertBefore(div, iframe); // <style>iframe { position: relative !important; }</style>
            div.appendChild(iframe);

            div.style.textAlign = "center";

            // Create a link element for the URL
            const link = document.createElement("a");
            const dl_link = `https://www.y2mate.com/youtube/${iframe.src.split("/")[4]}`
            link.href = dl_link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.style.textDecoration = "none";
            link.style.zIndex = "999";
            link.style.position = "relative";
            link.textContent = `Download Video`;

            // Append the link to the footer
            div.appendChild(link);

            console.log("Prepended download link to an iframe")
        }
    }


    // Do the stuff that needs to be done for google chat in particular
    // For this code to run, first make sure to select an element inside the chat.google.com iframe to ensure that the console runs it on that page and not on the parent page.
    if ((location.hostname == "chat.google.com") && frames.name.match(/(?:hostFrame\d+)|(?:spareFrame\d*)/)?.length && true ) {
        // Remove anything left behind by previous executions of the script
        document.querySelectorAll("#youtube-embed-downloader").forEach(element => element.remove());
        document.querySelectorAll("[youtube-embed-downloader-processed]").forEach(
            element => element.removeAttribute("youtube-embed-downloader-processed")
        );

        // A string of HTML code might not be allowed to be inserted without this whole policy detour
        let policy, trustedStyle, trustedA;
        try {
            policy = trustedTypes.createPolicy(
                // By using the date in the policy name, you never have to worry about not being able to create another default policy
                (new Date()).toString(),
                {
                    createHTML: (string) => string
                }
            );
            trustedStyle = policy.createHTML(
                `<style id="youtube-embed-downloader">a#youtube-embed-downloader:hover { opacity: 1 !important; }</style>`
            );
            trustedA = policy.createHTML( // Hehe the placeholder href brings you to a random pretty image :]
                `<a id="youtube-embed-downloader" href="https://picsum.photos/1920/1080" target="_blank" style="width: 320px; text-align: center; padding-top: 10px; opacity: .2; transition: opacity .2s;">Download Video</a>`
            );
        } catch (error) {
            // Still log the error if it's something unexpected
            // if ( error.message !== `Failed to execute 'createPolicy' on 'TrustedTypePolicyFactory': Policy with name "default" already exists.`)
                console.error(error)
            ;
        }

        if (typeof policy == "undefined") {
            trustedStyle =
                `<style id="youtube-embed-downloader">a#youtube-embed-downloader:hover { opacity: 1 !important; }</style>`
            ;
            trustedA = // Hehe the placeholder href brings you to a random pretty image :]
                `<a id="youtube-embed-downloader" href="https://picsum.photos/1920/1080" target="_blank" style="width: 320px; text-align: center; padding-top: 10px; opacity: .2; transition: opacity .2s;">Download Video</a>`
            ;
        }

        function processElement(element, style, a) {
            // Check if the element is for a YT embed and if a download link wasn't already placed
            if (
                element.querySelector("div > div > div > div > div.zFEXud > span.RhNmFb")?.innerText == "YouTube video" &&
                !element.querySelector("#youtube-embed-downloader")
            ) {
                // console.log(element); // Beware, this is kinda laggy for some reason
                element.insertAdjacentHTML("beforeend", style);
                element.insertAdjacentHTML("beforeend", a);
                let videoID = element.querySelector(".MFBre").getAttribute("data-id");
                element.querySelector("a#youtube-embed-downloader").href = `https://www.y2mate.com/youtube/${videoID}`;
                element.setAttribute("youtube-embed-downloader-processed", "");
                return;
            } else if (
                element.querySelector("div.V5MAMb > a.Pj9rof")?.href.includes("youtube.com/shorts/") &&
                !element.querySelector("#youtube-embed-downloader")
            ) {
                // console.log(element); // Beware, this is kinda laggy for some reason
                element.insertAdjacentHTML("beforeend", style);
                element.insertAdjacentHTML("beforeend", a);
                let videoID = element.querySelector("div.V5MAMb > a.Pj9rof").href.match(/(?<=youtube\.com\/shorts\/)\w{11}/)[0];
                element.querySelector("a#youtube-embed-downloader").href = `https://www.y2mate.com/youtube/${videoID}`;
                element.setAttribute("youtube-embed-downloader-processed", "");
                return;
            }
            let youtubeContainer = element.querySelector("div.V5MAMb > div.MFBre[data-id]");
            if (youtubeContainer == null)
                element.setAttribute("youtube-embed-downloader-processed", "")
            ;
        }

        // Insert the download link under all existing embeds
        document.querySelectorAll("div.kwI9i.zX644e.yqoUIf.n3AJp:not([youtube-embed-downloader-processed])").forEach(element => {
            processElement(element, trustedStyle, trustedA);
        });

        // Borrowing from library code available at:
        // https://gist.github.com/sidneys/ee7a6b80315148ad1fb6847e72a22313
        // or at:
        // https://greasyfork.org/en/scripts/374849-library-onelementready-es7

        let queryForElements = (selector, callback) => {
            // const attributeName = 'was-queried';
            let elementList = document.querySelectorAll(selector) || [];
            elementList.forEach((element) => {
                // if (element.hasAttribute(attributeName)) { return; }
                // element.setAttribute(attributeName, 'true');
                callback(element);
            });
        }

        // Wait for Elements with a given CSS selector to enter the DOM.
        // Returns a Promise resolving with new Elements, and triggers a callback for every Element.
        //     @param {String} selector - CSS Selector
        //     @param {Boolean=} findOnce - Stop querying after first successful pass
        //     @param {function=} callback - Callback with Element
        //     @returns {Promise<Element>} - Resolves with Element
        let onElementReady = (selector, findOnce = false, callback = () => { }) => {
            return new Promise((resolve) => {
                // Initial Query
                queryForElements(selector, (element) => {
                    resolve(element);
                    callback(element);
                });

                // Continuous Query
                const observer = new MutationObserver(() => {
                    // DOM Changes detected
                    queryForElements(selector, (element) => {
                        resolve(element);
                        callback(element);

                        if (findOnce) { observer.disconnect(); }
                    });
                });

                // Observe DOM Changes
                observer.observe(document.documentElement, {
                    attributes: false,
                    childList: true,
                    subtree: true
                });
            });
        }

        // Begin checking for any new embeded YouTube videos that might appear
        onElementReady("div.kwI9i.zX644e.yqoUIf.n3AJp:not([youtube-embed-downloader-processed])", false,
            element => processElement(element, trustedStyle, trustedA)
        );

    } else if (debug) {
        console.warn(
            `If you're trying to run the script in Google Chat, know that it is running in the "${
                frames.name == "" ? "top" : frames.name
            }" frame instead of one of the target "hostFrame#" or "spareFrame#" frames`)
        ;
    }

})();