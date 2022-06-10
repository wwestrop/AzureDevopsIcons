function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
        devopsHomepage: document.querySelector("#devopsHomepage").value
    });
}

function restoreOptions() {

    function setCurrentChoice(result) {
        document.querySelector("#devopsHomepage").value = result.devopsHomepage || "";
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get("devopsHomepage");
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);