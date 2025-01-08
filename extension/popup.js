document.getElementById("solveCaptcha").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["contentScript.js"]
    });
  } catch (error) {
    console.error("Error injecting script:", error);
  }
});
