/**
 * Blog Studio — private AI draft helper + optional GitHub publish.
 * API keys/tokens are stored only in your browser (localStorage).
 */
(function () {
  const LS = {
    openaiKey: "blog_studio_openai_key",
    ghToken: "blog_studio_gh_token",
    ghOwner: "blog_studio_gh_owner",
    ghRepo: "blog_studio_gh_repo",
    ghBranch: "blog_studio_gh_branch",
  };

  const $ = (id) => document.getElementById(id);

  const topicEl = $("studio-topic");
  const kwInput = $("studio-kw-input");
  const linkInput = $("studio-link-input");
  const rawEl = $("studio-raw");
  const kwListEl = $("studio-kw-list");
  const linkListEl = $("studio-link-list");
  const genBtn = $("studio-generate");
  const pubBtn = $("studio-publish");
  const dlBtn = $("studio-download-md");
  const statusEl = $("studio-status");
  const slugEl = $("studio-slug");
  const dateEl = $("studio-date");
  const excerptEl = $("studio-excerpt");
  const tabBlog = $("tab-blog");
  const tabLi = $("tab-linkedin");
  const paneBlog = $("pane-blog");
  const paneLi = $("pane-linkedin");
  const outBlog = $("studio-out-blog");
  const outLi = $("studio-out-linkedin");

  let keywords = [];
  let refLinks = [];
  let lastBlogMarkdown = "";
  let lastLinkedin = "";

  function load(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }
  function save(key, val) {
    try {
      if (val) localStorage.setItem(key, val);
      else localStorage.removeItem(key);
    } catch (_) {}
  }

  $("settings-toggle")?.addEventListener("click", () => {
    $("settings-panel").classList.toggle("is-open");
  });

  $("save-settings")?.addEventListener("click", () => {
    save(LS.openaiKey, $("cfg-openai").value.trim());
    save(LS.ghToken, $("cfg-gh-token").value.trim());
    save(LS.ghOwner, $("cfg-gh-owner").value.trim() || "shabeerresni");
    save(LS.ghRepo, $("cfg-gh-repo").value.trim() || "myprofile");
    save(LS.ghBranch, $("cfg-gh-branch").value.trim() || "main");
    setStatus("Settings saved in this browser only.", "ok");
  });

  function initSettingsFields() {
    $("cfg-openai").value = load(LS.openaiKey, "");
    $("cfg-gh-token").value = load(LS.ghToken, "");
    $("cfg-gh-owner").value = load(LS.ghOwner, "shabeerresni");
    $("cfg-gh-repo").value = load(LS.ghRepo, "myprofile");
    $("cfg-gh-branch").value = load(LS.ghBranch, "main");
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.dataset.kind = kind || "";
  }

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
  }

  function renderChips(container, items, type) {
    container.innerHTML = items
      .map(
        (item, i) =>
          `<span class="studio-chip">${escapeHtml(item)}<button type="button" data-i="${i}" data-type="${type}" aria-label="Remove">×</button></span>`
      )
      .join("");
    container.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.i);
        const t = btn.dataset.type;
        if (t === "kw") keywords = keywords.filter((_, j) => j !== i);
        else refLinks = refLinks.filter((_, j) => j !== i);
        renderChips(kwListEl, keywords, "kw");
        renderChips(linkListEl, refLinks, "link");
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addKeywordsFromInput() {
    const raw = kwInput.value.trim();
    if (!raw) return;
    raw.split(/[,;\n]+/).forEach((p) => {
      const t = p.trim();
      if (t && !keywords.includes(t)) keywords.push(t);
    });
    kwInput.value = "";
    renderChips(kwListEl, keywords, "kw");
  }

  function addLinkFromInput() {
    const raw = linkInput.value.trim();
    if (!raw) return;
    if (!refLinks.includes(raw)) refLinks.push(raw);
    linkInput.value = "";
    renderChips(linkListEl, refLinks, "link");
  }

  $("studio-kw-add")?.addEventListener("click", addKeywordsFromInput);
  kwInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeywordsFromInput();
    }
  });

  $("studio-link-add")?.addEventListener("click", addLinkFromInput);
  linkInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLinkFromInput();
    }
  });

  function todayISODate() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  if (dateEl && !dateEl.value) dateEl.value = todayISODate();

  topicEl?.addEventListener("input", () => {
    if (!slugEl.dataset.touched) slugEl.value = slugify(topicEl.value);
  });
  slugEl?.addEventListener("input", () => {
    slugEl.dataset.touched = "1";
  });

  function setTab(which) {
    const blog = which === "blog";
    tabBlog.classList.toggle("is-active", blog);
    tabLi.classList.toggle("is-active", !blog);
    paneBlog.hidden = !blog;
    paneLi.hidden = blog;
  }
  tabBlog?.addEventListener("click", () => setTab("blog"));
  tabLi?.addEventListener("click", () => setTab("linkedin"));

  function buildUserPromptBlock() {
    const topic = topicEl.value.trim();
    const raw = rawEl.value.trim();
    return [
      `Topic / working title: ${topic}`,
      `Themes & keywords: ${keywords.join(", ") || "(none)"}`,
      `Reference links: ${refLinks.join("\n") || "(none)"}`,
      "",
      "Raw ideas & talking points:",
      raw,
    ].join("\n");
  }

  function buildFullPromptForExternal() {
    const system = `You are Shabeer Mohamed, an enterprise cloud and technology sales leader (Oracle, IBM, APAC). Write in confident first person.

Return ONLY valid JSON (no markdown fences) with exactly two keys:
1) "blogMarkdown" — a 700–900 word thought leadership post in Markdown. Use ## subheadings, short paragraphs, and a strong closing paragraph. No YAML frontmatter.
2) "linkedinPost" — 180–220 words for LinkedIn: hook opener, punchy short paragraphs, end with a line break then 3–6 relevant hashtags on one line starting with #.

Tone: executive, direct, practical. No corporate fluff.`;
    return `${system}\n\n---\n\n${buildUserPromptBlock()}`;
  }

  function applyGeneratedJson(parsed) {
    lastBlogMarkdown = parsed.blogMarkdown || "";
    lastLinkedin = parsed.linkedinPost || "";
    if (!lastBlogMarkdown && !lastLinkedin) {
      throw new Error("JSON must include blogMarkdown and/or linkedinPost.");
    }
    if (typeof marked !== "undefined" && marked.parse) {
      outBlog.innerHTML = marked.parse(lastBlogMarkdown, { mangle: false, headerIds: true });
    } else {
      outBlog.textContent = lastBlogMarkdown;
    }
    outLi.textContent = lastLinkedin;
    if (!excerptEl.value.trim()) {
      const plain = lastBlogMarkdown.replace(/[#>*_\[\]`-]/g, " ").replace(/\s+/g, " ").trim();
      excerptEl.value = plain.slice(0, 200) + (plain.length > 200 ? "…" : "");
    }
    setTab("blog");
  }

  $("studio-copy-prompt")?.addEventListener("click", async () => {
    const text = buildFullPromptForExternal();
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Prompt copied to clipboard.", "ok");
    } catch {
      setStatus("Could not copy automatically — select and copy the prompt from the console or type manually.", "err");
    }
  });

  $("studio-import-apply")?.addEventListener("click", () => {
    const raw = $("studio-import-json").value.trim();
    if (!raw) {
      setStatus("Paste JSON first.", "err");
      return;
    }
    try {
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
      applyGeneratedJson(parsed);
      setStatus("Applied from JSON. Review tabs, then publish or download.", "ok");
    } catch (e) {
      setStatus("Invalid JSON. Paste only the object with blogMarkdown and linkedinPost.", "err");
    }
  });

  genBtn?.addEventListener("click", async () => {
    const apiKey = load(LS.openaiKey, "");
    if (!apiKey) {
      setStatus('Add an OpenAI API key under "Connection settings" first.', "err");
      $("settings-panel").classList.add("is-open");
      return;
    }
    const topic = topicEl.value.trim();
    const raw = rawEl.value.trim();
    if (!topic || !raw) {
      setStatus("Topic and raw ideas are required.", "err");
      return;
    }

    genBtn.disabled = true;
    setStatus("Generating…", "");

    const userBlock = buildUserPromptBlock();

    const system = `You are Shabeer Mohamed, an enterprise cloud and technology sales leader (Oracle, IBM, APAC). Write in confident first person.

Return ONLY valid JSON (no markdown fences) with exactly two keys:
1) "blogMarkdown" — a 700–900 word thought leadership post in Markdown. Use ## subheadings, short paragraphs, and a strong closing paragraph. No YAML frontmatter.
2) "linkedinPost" — 180–220 words for LinkedIn: hook opener, punchy short paragraphs, end with a line break then 3–6 relevant hashtags on one line starting with #.

Tone: executive, direct, practical. No corporate fluff.`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: userBlock },
          ],
          temperature: 0.7,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data.error?.message || res.statusText;
        throw new Error(err);
      }
      const text = data.choices?.[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Model did not return valid JSON.");
      }
      applyGeneratedJson(parsed);
      setStatus("Done. Review both tabs, then publish or download.", "ok");
    } catch (e) {
      const msg = String(e.message || e);
      setStatus(
        `${msg} — If you see “Failed to fetch”, open “Plan B — if Generate does not work” below and use ChatGPT instead.`,
        "err"
      );
    } finally {
      genBtn.disabled = false;
    }
  });

  dlBtn?.addEventListener("click", () => {
    if (!lastBlogMarkdown) {
      setStatus("Generate a post first.", "err");
      return;
    }
    const slug = (slugEl.value.trim() && slugify(slugEl.value)) || slugify(topicEl.value) || "draft-post";
    const date = dateEl.value || todayISODate();
    const title = topicEl.value.trim() || "Untitled draft";
    const excerpt = (excerptEl.value.trim() || "Draft from Blog Studio.").replace(/\r?\n/g, " ");
    const front = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: ${date}\nexcerpt: "${excerpt.replace(/"/g, '\\"')}"\nslug: ${slug}\n---\n\n`;
    const blob = new Blob([front + lastBlogMarkdown], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${date}-${slug}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Markdown file downloaded. Commit it to _posts/ and update posts-manifest.json, or use Publish.", "ok");
  });

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function b64ToUtf8(b64) {
    const binary = atob(String(b64).replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  async function githubGetJson(url, token) {
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return r;
  }

  pubBtn?.addEventListener("click", async () => {
    if (!lastBlogMarkdown) {
      setStatus("Generate a post first.", "err");
      return;
    }
    const token = load(LS.ghToken, "");
    const owner = load(LS.ghOwner, "shabeerresni");
    const repo = load(LS.ghRepo, "myprofile");
    const branch = load(LS.ghBranch, "main");
    if (!token) {
      setStatus("Add a GitHub personal access token under Connection settings to publish.", "err");
      $("settings-panel").classList.add("is-open");
      return;
    }

    const slug = (slugEl.value.trim() && slugify(slugEl.value)) || slugify(topicEl.value);
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setStatus("Slug must be lowercase letters, numbers, and hyphens only.", "err");
      return;
    }
    const date = dateEl.value || todayISODate();
    const title = topicEl.value.trim() || "Untitled post";
    const excerpt = (excerptEl.value.trim() || "New post.").replace(/\r?\n/g, " ");
    const filename = `${date}-${slug}.md`;
    const filePath = `_posts/${filename}`;
    const front = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndate: ${date}\nexcerpt: "${excerpt.replace(/"/g, '\\"')}"\nslug: ${slug}\n---\n\n`;
    const fullMd = front + lastBlogMarkdown;

    pubBtn.disabled = true;
    setStatus("Publishing to GitHub…", "");

    const base = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    try {
      let sha;
      const existing = await githubGetJson(`${base}/${filePath}`, token);
      if (existing.status === 200) {
        const j = await existing.json();
        sha = j.sha;
      } else if (existing.status !== 404) {
        const err = await existing.json().catch(() => ({}));
        throw new Error(err.message || `GitHub ${existing.status}`);
      }

      const putPost = await fetch(`${base}/${filePath}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `blog: add ${slug}`,
          content: utf8ToBase64(fullMd),
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (!putPost.ok) {
        const err = await putPost.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create post file");
      }

      const manUrl = `${base}/blog/posts-manifest.json`;
      const manRes = await githubGetJson(manUrl, token);
      if (!manRes.ok) {
        throw new Error("Could not read blog/posts-manifest.json (check repo name and token scope).");
      }
      const manJson = await manRes.json();
      const currentSha = manJson.sha;
      const manifest = JSON.parse(b64ToUtf8(manJson.content));
      const posts = Array.isArray(manifest.posts) ? manifest.posts : [];
      const entry = {
        slug,
        file: filename,
        date,
        title,
        excerpt,
      };
      const nextPosts = [entry, ...posts.filter((p) => p.slug !== slug)];
      nextPosts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const newBody = JSON.stringify({ posts: nextPosts }, null, 2) + "\n";

      const putMan = await fetch(manUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `blog: manifest for ${slug}`,
          content: utf8ToBase64(newBody),
          branch,
          sha: currentSha,
        }),
      });
      if (!putMan.ok) {
        const err = await putMan.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update posts-manifest.json");
      }

      setStatus(`Published. Post: /blog/post.html?slug=${slug} — wait ~1 min for GitHub Pages.`, "ok");
    } catch (e) {
      setStatus(String(e.message || e), "err");
    } finally {
      pubBtn.disabled = false;
    }
  });

  initSettingsFields();
})();
