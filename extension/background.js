chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("wesite_api_url", (result) => {
    if (!result.wesite_api_url) {
      chrome.storage.local.set({ wesite_api_url: "http://localhost:3000" });
    }
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "save-page") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.url) return;

      chrome.storage.local.get(["wesite_token", "wesite_api_url"], async (storage) => {
        const token = storage.wesite_token;
        const baseUrl = storage.wesite_api_url || "http://localhost:3000";

        if (!token) {
          chrome.action.openPopup();
          return;
        }

        try {
          const response = await fetch(`${baseUrl}/api/websites`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ url: tab.url }),
          });

          const data = await response.json().catch(() => ({}));

          if (response.ok) {
            chrome.notifications?.create({
              type: "basic",
              iconUrl: "icons/icon-128.png",
              title: "Wesite",
              message: `Saved: ${data.website?.title || tab.url}`,
            });
          } else if (response.status === 409) {
            chrome.notifications?.create({
              type: "basic",
              iconUrl: "icons/icon-128.png",
              title: "Wesite",
              message: "This page is already saved!",
            });
          } else {
            chrome.action.openPopup();
          }
        } catch {
          chrome.action.openPopup();
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_PAGE") {
    chrome.storage.local.get(["wesite_token", "wesite_api_url"], async (storage) => {
      const token = storage.wesite_token;
      const baseUrl = storage.wesite_api_url || "http://localhost:3000";

      if (!token) {
        sendResponse({ ok: false, error: "Not signed in" });
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/websites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: message.url,
            folderId: message.folderId || null,
            tags: message.tags || [],
            notes: message.notes || "",
            isFavorite: message.isFavorite || false,
          }),
        });

        const data = await response.json().catch(() => ({}));
        sendResponse({ ok: response.ok, data });
      } catch (error) {
        sendResponse({ ok: false, error: error.message });
      }
    });

    return true;
  }
});
