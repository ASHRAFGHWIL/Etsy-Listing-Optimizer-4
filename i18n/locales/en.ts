const en = {
  "common": {
    "appName": "Etsy Listing Optimizer",
    "generate": "Generate",
    "generating": "Generating...",
    "save": "Save Changes",
    "cancel": "Cancel",
    "characterCount": "Character count: {{count}}",
    "charLimit": "({{length}}/{{limit}})",
    "or": "OR"
  },
  "header": {
    "title": "Etsy Listing Optimizer",
    "toggleTheme": "Toggle dark mode"
  },
  "form": {
    "title": "1. Enter Your Product Idea",
    "description": "Describe your product in a few sentences. Mention what it is, key features, and who it's for. The more detail, the better!",
    "placeholder": "e.g., A handmade leather journal with a vintage world map cover, perfect for travelers and writers. It has 200 pages of acid-free paper...",
    "priorityKeyword": {
      "title": "Priority Keyword (Optional)",
      "description": "Enter one high-impact keyword to place at the beginning of your title. This is often the most searched term for your product.",
      "placeholder": "e.g., Personalized Gift"
    },
    "intent": {
        "title": "Purchase Intent / Target Audience (Optional)",
        "description": "Select who this product is primarily designed for to tailor the SEO and description tone.",
        "placeholder": "Select an audience...",
        "options": {
            "professionals": "Professionals & Large Business Owners",
            "beginners": "Beginners & Small Business Owners",
            "handicrafts": "Small Handicrafts & DIY Makers",
            "children": "Children's Rooms",
            "home_decor": "Home Decor Enthusiasts",
            "commercial": "Shops & Cafes"
        }
    },
    "geography": {
        "title": "International Targeting (Optional)",
        "description": "Select your primary region to optimize spelling (US vs UK) and trends.",
        "placeholder": "Select a region...",
        "options": {
            "us": "US Audience",
            "europe": "European Audience",
            "south_america": "South America",
            "asia": "Asian Audience",
            "north_africa": "North African Audience"
        }
    },
    "seasonalKeywords": {
      "button": "Suggest Seasonal Keywords",
      "loading": "Finding trends...",
      "description": "Get 5 trending, seasonal keywords based on your description."
    },
    "imageTitle": "2. Upload Product Images (Optional)",
    "imageDescription": "Upload up to 20 images to generate SEO-optimized alt-text. This helps with accessibility and search engine visibility.",
    "uploadButton": "Click to upload",
    "orDrag": "or drag and drop",
    "imageLimitText": "Up to {{limit}} images (PNG, JPG, WEBP)",
    "removeImage": "Remove image",
    "addFromUrl": {
      "title": "Or add images from URLs",
      "placeholder": "Enter one image URL per line",
      "button": "Add Images",
      "loading": "Fetching..."
    },
    "button": {
      "idle": "Create Listing",
      "loading": "Generating..."
    },
    "error": {
      "generic": "An unknown error occurred.",
      "apiError": "Failed to generate listing. Please check your API key and try again.",
      "empty": "Please enter a product description.",
      "imageLimit": "You can upload a maximum of {{limit}} images.",
      "altText": "Failed to generate alt-text for this image.",
      "noUrls": "Please enter at least one URL.",
      "someUrlsFailed": "Could not fetch some images. Please check the URLs and ensure they are publicly accessible."
    }
  },
  "results": {
    "title": "Your Optimized Listing",
    "cardTitle": "Title",
    "cardCategory": "Category",
    "cardDescription": "Description",
    "cardAltText": "Image Alt-Texts",
    "cardKeywords": "SEO Keywords",
    "cardTags": "Etsy Tags",
    "cardTagsDescription": "Copy and paste these tags directly into your Etsy listing's 'Tags' section.",
    "cardMaterials": "Materials",
    "cardMaterialsTags": "Materials Tags",
    "cardMaterialsTagsDescription": "A comma-separated list of materials for easy copying and pasting.",
    "cardAttributes": "Attributes",
    "cardColors": "SEO-Optimized Colors",
    "cardStoreSections": "Store Sections",
    "cardPricing": "Pricing Suggestions",
    "cardSources": "Sources",
    "altTitles": "Alternative Titles",
    "loadingAltTitles": "Generating suggestions...",
    "altCategories": "Alternative Categories",
    "loadingAltCategories": "Generating suggestions...",
    "loadingAltText": "Generating alt-text for images...",
    "filterByVolume": "Filter by volume",
    "checklist": {
      "title": "Optimization Checklist",
      "description": "Follow these specific steps to ensure your listing ranks high.",
      "completed": "Completed"
    },
    "volumes": {
      "all": "All",
      "high": "High",
      "medium": "Medium",
      "low": "Low"
    },
    "pricingTiers": {
      "budget": "Budget",
      "standard": "Standard",
      "premium": "Premium"
    }
  },
  "seoNotes": {
    "title": "Etsy SEO Logic & Constraints",
    "titleLength": "Title is limited to 14 words max to focus on high-impact keywords.",
    "tagLength": "Tags are strictly max 20 characters each.",
    "frontLoading": "Exact match keywords are placed at the beginning of the title.",
    "noRepetition": "Repeated words are avoided to maximize reach (no keyword stuffing)."
  },
  "modal": {
    "title": "Refine Keyword",
    "description": "You can edit the keyword directly or use AI to generate a new one.",
    "inputLabel": "Keyword input",
    "regenerate": "Regenerate",
    "error": "Failed to regenerate keyword. Please try again."
  },
  "aria": {
    "copy": "Copy to clipboard",
    "refine": "Refine keyword"
  },
  "tooltip": {
    "toggleTheme": "Toggle theme",
    "copy": "Copy to clipboard",
    "refineKeyword": "Refine this keyword",
    "regenerateKeywordAI": "Regenerate with AI",
    "saveChanges": "Save your changes",
    "cancel": "Discard changes",
    "removeImage": "Remove uploaded image",
    "switchToEnglish": "Switch to English",
    "switchToArabic": "Switch to Arabic",
    "priorityKeyword": "This is your user-defined priority keyword.",
    "etsyTitleStrategy": "Etsy's search prioritizes the first ~40 characters of your title. Ensure your most important keywords are front-loaded, as this is what shoppers see first.",
    "copyAllKeywords": "Copy all keywords",
    "copyAllTags": "Copy all tags",
    "copyAllAttributes": "Copy all attributes",
    "copyAllMaterials": "Copy all materials",
    "copyAllMaterialsTags": "Copy all materials as tags",
    "copyAllColors": "Copy all colors",
    "copyAllStoreSections": "Copy all store sections"
  }
};
export default en;