import { GoogleGenAI, Type } from "@google/genai";
import { ListingData, Keyword } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const INTENT_PROMPTS: Record<string, string> = {
  professionals: "Target Audience: Professionals and large business owners. Focus on scalability, high quality, efficiency, and commercial value. Tone: Professional, authoritative, and premium.",
  beginners: "Target Audience: Beginners and small business owners. Focus on ease of use, starter-friendly features, and growth potential. Tone: Encouraging, accessible, and clear.",
  handicrafts: "Target Audience: Small handicraft makers and DIY artisans. Focus on creativity, uniqueness, craft supplies, and handmade quality. Tone: Creative, inspiring, and supportive.",
  children: "Target Audience: Children's rooms and parents. Focus on safety, playfulness, education, and whimsical design. Tone: Fun, gentle, and family-oriented.",
  home_decor: "Target Audience: Home decor enthusiasts and interior styling. Focus on aesthetics, trends, atmosphere, and style. Tone: Stylish, cozy, and aspirational.",
  commercial: "Target Audience: Shops, cafes, and physical retail spaces. Focus on durability, customer appeal, display value, and commercial utility. Tone: Business-oriented, practical, and inviting."
};

export async function generateListing(productDescription: string, priorityKeyword?: string, purchaseIntent?: string): Promise<ListingData> {
  const intentInstruction = purchaseIntent && INTENT_PROMPTS[purchaseIntent] 
    ? `\n    ${INTENT_PROMPTS[purchaseIntent]}\n` 
    : '';

  const prompt = `
    You are an expert Etsy SEO and marketing specialist. Your target audience is professional Etsy sellers in the US and European markets.
    Using real-time search data from Google, find the best keywords that customers are currently using to search for a product like this: "${productDescription}".
    
    ${priorityKeyword ? `A priority keyword has been provided: "${priorityKeyword}". You MUST place this exact keyword at the very beginning of the generated title.` : ''}
    ${intentInstruction}

    Generate a complete, SEO-optimized Etsy product listing based on your findings.

    You MUST respond with a valid JSON object.
    The JSON object should be enclosed in a single markdown code block (e.g. \`\`\`json ... \`\`\`).
    The JSON object must have the following structure: {
      "title": "string",
      "description": "string",
      "keywords": [{ "keyword": "string", "volume": "string (High, Medium, or Low)", "reason": "string" }],
      "category": "string",
      "materials": ["string"],
      "attributes": { "key1": "value1", "key2": "value2" },
      "colors": ["string"],
      "storeSections": ["string"],
      "pricingSuggestions": [{ "tier": "string (Budget, Standard, or Premium)", "price": "number", "currency": "USD", "reason": "string" }],
      "checklist": [{ "element": "string (e.g. Photos, Title)", "instruction": "string (actionable tip)" }]
    }

    Ensure all constraints are met:
    - Title: Create a high-converting, keyword-rich Etsy title optimized for First Page ranking.
      - LENGTH: Strictly between 3 and 14 words long. Max 140 characters.
      - ETSY ALGORITHM STRATEGY:
        1. **Exact Match Front-Loading**: The first 40 characters are the most critical. Place the absolute highest volume "exact match" keyword phrase first.
        2. **Distinct Phrases**: Use 2-3 strong, distinct phrases separated by commas.
        3. **No Keyword Stuffing**: Do NOT repeat the same word multiple times (e.g., Don't write "Gold Ring, Gold Jewelry, Gold Gift". Write "18k Gold Ring, Minimalist Jewelry, Anniversary Gift").
      - REFERENCE EXAMPLE: "Linen Summer Dress, Sleeveless Midi Sundress, Boho Beach Wear"
      - DO NOT use the words: "png", "download", "cute", "instant".
      - Avoid subjective adjectives that aren't specific (like "cute", "nice").
      - Critically, place the most important, highest-volume keywords at the very beginning of the title.${priorityKeyword ? ' It MUST start with the priority keyword.' : ' If no priority keyword is provided, the title MUST start with the top keyword from your generated list.'}
    - Description: Create a compelling, professional Etsy description (approx 800-1000 characters).
      - STRUCTURE & FORMAT: **STRICT VERTICAL LAYOUT**. Do NOT write long paragraphs. Present the content as a beautiful, easy-to-scan vertical list using the "What, Why, How" framework.
      - VISUAL STYLE: Use Markdown formatting. Use bullet points (•) or emoji bullets for EVERY single point. Add distinct line breaks between sections.
        - Section 1 Header: **✨ What It Is**
          - (Use vertical bullet points here to describe features).
        - Section 2 Header: **💖 Why You'll Love It**
          - (Use vertical bullet points here to highlight benefits/emotions).
        - Section 3 Header: **🛠️ How It's Made / Details**
          - (Use vertical bullet points here to describe technical specs/dimensions).
      - Emojis: Use professional emojis in headers and as bullet points to make it look aesthetic and organized.
      - Readability: MAXIMIZE WHITE SPACE. One point per line. No walls of text.
      - Strategy: Naturally integrate the top search queries (keywords) provided.
      - Call to Action: End with a clear, persuasive Call to Action (CTA) encouraging the purchase (e.g., "🛒 Add to cart now!") on its own line with an emoji.
      - **Targeting**: tailor the language, benefits, and use cases specifically to the defined target audience if one was provided.
    - Keywords: Exactly 13 keyword objects.
      - STRATEGY: You MUST utilize all 13 keyword tags. Diversify them strictly across these 3 categories to maximize search reach:
        1. **Technical/Descriptive**: Specifics about the item, materials, style (e.g., "linen dress", "abstract print").
        2. **Occasion**: Events or holidays (e.g., "wedding gift", "housewarming", "christmas").
        3. **Recipient**: Who is it for? (e.g., "gift for her", "dad birthday", "dog mom").
      - "keyword": A 2 or 3 word string, STRICTLY max 20 characters (Etsy limit). Optimized for high search volume on Etsy and Google for US and European markets.
      - "volume": The estimated search volume, categorized as "High", "Medium", or "Low".
      - "reason": A brief explanation (max 100 characters) for why this keyword is recommended.
      - The list must be sorted with the highest search volume keywords appearing first.
    - Category: The single most accurate Etsy category.
    - Materials: Exactly 13 relevant materials.
    - Attributes: Generate between 5 to 8 relevant product attributes as a key-value JSON object to help buyers filter searches.
      - INCLUDE SPECIFIC ETSY ATTRIBUTES: "File Type" (for digital), "Craft Type" (e.g. Sewing, Woodworking), "Occasion" (e.g. Wedding, Birthday), "Holiday" (e.g. Christmas), "Primary Color", "Secondary Color", "Style", "Theme".
    - Colors: Generate between 5 to 7 relevant and popular color names for this product. These should be terms people are likely to search for (e.g., "Forest Green", "Rose Gold", "Matte Black").
    - Store Sections: Generate between 5 to 7 relevant store section names. These should be SEO-friendly categories a seller could use to group this product with similar items in their Etsy shop (e.g., "Gifts for Her", "Wall Art Prints", "Handmade Jewelry").
    - Pricing Suggestions: Generate exactly 3 pricing suggestions for this product in USD.
      - ANALYZE: Analyze competitor pricing for similar detailed digital product bundles to validate your chosen tiers (Budget, Standard, Premium).
      - GOAL: Ensure the prices strike a balance between profitability and competitiveness in the current market.
      - Each suggestion must include:
        - "tier": A string, must be one of "Budget", "Standard", or "Premium".
        - "price": A number representing the price in USD.
        - "currency": A string, which MUST be "USD".
        - "reason": A brief explanation (max 100 characters) for this pricing tier, considering market competition and perceived value.
        - The list must be ordered with Budget first, then Standard, then Premium.
    - Checklist: Generate exactly 6 actionable optimization steps specific to this product.
      - Cover these elements: Title, Photos, Description, Pricing, Tags, Attributes.
      - "element": The part of the listing (e.g., "Photos").
      - "instruction": A specific, actionable instruction (e.g., "Ensure at least one photo shows the product relative to a hand for scale.").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const text = response.text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    
    if (!jsonMatch || !jsonMatch[1]) {
        console.error("Raw response text:", text);
        throw new Error("Could not parse JSON from the model's response.");
    }

    const jsonString = jsonMatch[1];
    const parsedData = JSON.parse(jsonString);
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Validation for the new Keyword structure
    const areKeywordsValid = Array.isArray(parsedData.keywords) && parsedData.keywords.every(
        (kw: any) => typeof kw.keyword === 'string' && 
                     typeof kw.volume === 'string' &&
                     typeof kw.reason === 'string'
    );

    const arePricingSuggestionsValid = Array.isArray(parsedData.pricingSuggestions) &&
      parsedData.pricingSuggestions.length > 0 &&
      parsedData.pricingSuggestions.every(
        (p: any) => typeof p.tier === 'string' &&
                     typeof p.price === 'number' &&
                     p.currency === 'USD' &&
                     typeof p.reason === 'string'
      );

    const isChecklistValid = Array.isArray(parsedData.checklist) && parsedData.checklist.every(
        (c: any) => typeof c.element === 'string' && typeof c.instruction === 'string'
    );

    if (
      typeof parsedData.title === 'string' &&
      typeof parsedData.description === 'string' &&
      typeof parsedData.category === 'string' &&
      areKeywordsValid &&
      Array.isArray(parsedData.materials) &&
      Array.isArray(parsedData.colors) &&
      Array.isArray(parsedData.storeSections) &&
      arePricingSuggestionsValid &&
      typeof parsedData.attributes === 'object' && parsedData.attributes !== null && !Array.isArray(parsedData.attributes) &&
      isChecklistValid
    ) {
      return { ...parsedData, sources: groundingMetadata };
    } else {
      console.error("Generated data validation failed. Data:", parsedData);
      throw new Error("Generated data does not match the expected format.");
    }
  } catch (error) {
    console.error("Error generating listing with Gemini API:", error);
    throw new Error("Failed to generate listing. Please check your API key and try again.");
  }
}

export async function generateAltText(
  productDescription: string,
  keywords: Keyword[],
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const keywordStrings = keywords.map(k => k.keyword);
  const mainKeywords = keywordStrings.slice(0, 2).join(', '); // Use the top 2 keywords
  const prompt = `
    Based on the provided image and the following product information, generate a short, descriptive, and SEO-optimized alt-text.
    Product Description: "${productDescription}"
    Main SEO Keywords: "${mainKeywords}"

    Follow these rules strictly:
    1. The alt-text must be a maximum of 125 characters.
    2. It must include 1-2 of the main SEO keywords naturally.
    3. It must focus on the product type, material, and main usage.
    4. It must be attractive for both search engines and accessibility tools.
    5. Do NOT use generic words like "image of" or "photo of".
    6. Use buyer-friendly wording that highlights the product's uniqueness.
    7. Respond with ONLY the alt-text string, and nothing else.
  `;

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    const altText = response.text.trim().replace(/["']/g, '');

    if (!altText) {
      throw new Error("API returned an empty alt-text.");
    }

    return altText.slice(0, 125); // Enforce character limit
  } catch (error) {
    console.error("Error generating alt text with Gemini API:", error);
    throw new Error("Failed to generate alt-text for the image.");
  }
}


export async function generateAlternativeTitles(
  productDescription: string,
  originalTitle: string,
  keywords: Keyword[],
  priorityKeyword?: string,
): Promise<string[]> {
  const keywordStrings = keywords.map(k => k.keyword);
  const prompt = `
    You are an expert Etsy SEO and marketing specialist for the US market.
    Based on the following product details, generate 3 alternative, SEO-optimized titles.

    Product Description: "${productDescription}"
    Original Title: "${originalTitle}"
    Keywords: "${keywordStrings.join(', ')}"
    ${priorityKeyword ? `A priority keyword has been provided: "${priorityKeyword}". You MUST place this exact keyword at the very beginning of EACH alternative title.` : ''}

    Constraints for each new title:
    - Must be unique and different from the original title.
    - Must be highly relevant to the product.
    - Strictly between 3 and 14 words long. Max 140 characters.
    - OPTIMIZATION: Follow Etsy's "First Page" best practices.
      1. Front-load the main keyword phrase.
      2. Use distinct, high-value phrases separated by commas.
      3. Avoid repetition (do not repeat words like "Gift" or "Art" multiple times).
    - REFERENCE EXAMPLE: "Linen Summer Dress, Sleeveless Midi Sundress, Boho Beach Wear"
    - DO NOT use the words: "png", "download", "cute".
    - Avoid subjective adjectives.
    - Must be easy to read for all audiences.
    - Must be compelling for potential buyers.
    ${priorityKeyword ? '- Each title MUST start with the priority keyword.' : ''}

    You MUST respond with a valid JSON array of exactly 3 title strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "An array of exactly 3 alternative SEO-optimized titles, each max 140 characters.",
          items: { type: Type.STRING }
        }
      }
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData)) {
      return parsedData.slice(0, 3); // Ensure only 3 are returned
    } else {
      console.warn("API returned unexpected format for alternative titles, returning empty array.");
      return [];
    }
  } catch (error) {
    console.error("Error generating alternative titles with Gemini API:", error);
    return []; // Return empty array on error to not break the UI
  }
}

export async function generateAlternativeCategories(
  productDescription: string,
  originalCategory: string,
  keywords: Keyword[]
): Promise<string[]> {
  const keywordStrings = keywords.map(k => k.keyword);
  const prompt = `
    You are an expert Etsy SEO and marketing specialist.
    Based on the product description and keywords, generate 3 alternative, relevant Etsy categories.

    Product Description: "${productDescription}"
    Original Category: "${originalCategory}"
    Keywords: "${keywordStrings.join(', ')}"

    Constraints for each new category:
    - Must be a valid and specific Etsy category path (e.g., "Art & Collectibles > Painting > Oil").
    - Must be unique and different from the original category.
    - Must be highly relevant to the product.

    You MUST respond with a valid JSON array of exactly 3 category strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "An array of exactly 3 alternative, relevant Etsy categories.",
          items: { type: Type.STRING }
        }
      }
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData)) {
      return parsedData.slice(0, 3);
    } else {
      console.warn("API returned unexpected format for alternative categories, returning empty array.");
      return [];
    }
  } catch (error) {
    console.error("Error generating alternative categories with Gemini API:", error);
    return []; // Return empty array on error to not break the UI
  }
}

export async function regenerateKeyword(
  productDescription: string,
  existingKeywords: Keyword[],
  keywordToReplace: string
): Promise<Keyword> {
  const otherKeywords = existingKeywords.map(kw => kw.keyword).filter(kwText => kwText !== keywordToReplace).join(', ');

  const prompt = `
    You are an expert Etsy SEO specialist.
    Based on the product description: "${productDescription}".
    And considering the existing SEO keywords: "${otherKeywords}".
    
    Generate a new, unique, and highly relevant SEO keyword object to replace "${keywordToReplace}".
    
    Constraints for the new keyword:
    - Must be 2 or 3 words.
    - Must be a maximum of 20 characters, including spaces (Etsy limit).
    - Must be a high-volume search term on Etsy and Google, targeting US and European markets.
    - Must NOT be in the list of existing keywords.

    You MUST respond with a valid JSON object with the following structure:
    {
      "keyword": "string (the new keyword)",
      "volume": "string (High, Medium, or Low)",
      "reason": "string (a brief explanation for the new keyword, max 100 chars)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            volume: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ['keyword', 'volume', 'reason'],
        }
      }
    });
    
    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }

    const newKeyword = JSON.parse(jsonString);

    if (!newKeyword || !newKeyword.keyword || !newKeyword.volume || !newKeyword.reason) {
      throw new Error("API returned an invalid keyword object.");
    }

    return newKeyword;
  } catch (error) {
    console.error("Error regenerating keyword with Gemini API:", error);
    throw new Error("Failed to regenerate keyword.");
  }
}

export async function generateSeasonalKeywords(productDescription: string): Promise<string[]> {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const prompt = `
    You are an expert Etsy SEO specialist.
    The current date is ${currentDate}.
    
    Based on the product description: "${productDescription}", suggest exactly 5 seasonal, high-search-volume keywords that are trending right now or will be trending very soon (within the next 1-2 months).
    
    Constraints:
    - Each keyword MUST be exactly 3 words long.
    - Keywords must be highly relevant to the product AND the season/upcoming holidays.
    - Keywords must be distinct from each other.
    
    Return ONLY a valid JSON array of strings. Example: ["christmas gift idea", "winter wool scarf", "holiday home decor"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData)) {
      return parsedData.slice(0, 5);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error generating seasonal keywords:", error);
    return [];
  }
}