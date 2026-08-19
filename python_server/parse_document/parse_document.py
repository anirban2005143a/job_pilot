import re
import pymupdf
import pymupdf4llm


def pdf_to_markdown(file_path: str) -> str:
    markdown = pymupdf4llm.to_markdown(
        file_path,
        use_ocr=False,
    )

    doc = pymupdf.open(file_path)
    links = []
    seen_urls = set()

    for page in doc:
        for link in page.get_links():
            url = link.get("uri")
            rect = link.get("from")

            if not url or url in seen_urls:
                continue

            seen_urls.add(url)

            text = ""
            if rect:
                text = page.get_text(
                    "text",
                    clip=rect,
                ).strip()

            # Skip mailto links; the email is already
            # represented as normal text.
            if url.lower().startswith("mailto:"):
                continue

            # Clean hyperlink label
            text = re.sub(r"\s+", " ", text)
            text = text.strip(" \t\r\n.,;:|_")

            links.append((text or "Link", url))

    doc.close()

    if links:
        link_lines = ["# Extracted Links", ""]

        for text, url in links:
            link_lines.append(
                f"- {text}: {url}"
            )

        link_lines += ["", "---", ""]

        markdown = "\n".join(link_lines) + markdown

    # Remove control characters
    markdown = "".join(
        c for c in markdown
        if c in "\n\t" or ord(c) >= 32
    )

    # Normalize excessive blank lines
    markdown = re.sub(
        r"\n{3,}",
        "\n\n",
        markdown,
    )

    return markdown.strip()