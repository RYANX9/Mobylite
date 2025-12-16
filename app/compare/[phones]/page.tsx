# Add these endpoints to your FastAPI main.py

from urllib.parse import unquote

def normalize_slug(slug: str) -> str:
    """Convert URL slug to searchable format"""
    return slug.replace('-', ' ').strip().lower()

@app.get("/phones/slug/{brand}/{model}")
def get_phone_by_slug(brand: str, model: str):
    """
    Get phone by SEO-friendly URL slug
    Example: /phones/slug/apple/iphone-15-pro-max
    """
    brand_decoded = unquote(brand)
    model_decoded = unquote(model)
    
    brand_normalized = normalize_slug(brand_decoded)
    model_normalized = normalize_slug(model_decoded)
    
    with get_phones_db() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Try exact match first
        cursor.execute(
            """SELECT * FROM phones 
               WHERE LOWER(brand) = %s 
               AND LOWER(REPLACE(model_name, ' ', '-')) = %s
               LIMIT 1""",
            (brand_normalized, model_normalized)
        )
        
        phone = cursor.fetchone()
        
        # Fallback: fuzzy match on model name
        if not phone:
            cursor.execute(
                """SELECT * FROM phones 
                   WHERE LOWER(brand) = %s 
                   AND LOWER(model_name) LIKE %s
                   ORDER BY release_year DESC NULLS LAST
                   LIMIT 1""",
                (brand_normalized, f"%{model_normalized.replace('-', '%')}%")
            )
            phone = cursor.fetchone()
        
        if not phone:
            raise HTTPException(status_code=404, detail="Phone not found")
        
        phone_dict = dict(phone)
        phone_id = phone_dict['id']
    
    # Get reviews
    with get_users_db() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            """SELECT r.*, u.display_name, u.avatar_url
               FROM reviews r
               JOIN users u ON r.user_id = u.id
               WHERE r.phone_id = %s AND r.is_visible = TRUE
               ORDER BY r.helpful_count DESC, r.created_at DESC
               LIMIT 20""",
            (phone_id,)
        )
        reviews = cursor.fetchall()
    
    stats = get_phone_stats_cached(phone_id)
    
    return {
        "success": True,
        "phone": phone_dict,
        "reviews": reviews,
        "stats": stats
    }


@app.get("/phones/compare-by-slug/{slugs}")
def compare_phones_by_slug(slugs: str):
    """
    Compare phones via URL slugs separated by '-vs-'
    Example: /phones/compare-by-slug/iphone-15-pro-vs-samsung-s24-ultra-vs-pixel-8-pro
    """
    slugs_decoded = unquote(slugs)
    phone_slugs = slugs_decoded.split('-vs-')
    
    if len(phone_slugs) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 phones allowed")
    
    if len(phone_slugs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 phones required for comparison")
    
    phones = []
    
    with get_phones_db() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        for slug in phone_slugs:
            normalized = normalize_slug(slug)
            
            # Search by model name with fuzzy matching
            cursor.execute(
                """SELECT * FROM phones 
                   WHERE LOWER(REPLACE(model_name, ' ', '-')) LIKE %s
                   OR LOWER(model_name) LIKE %s
                   ORDER BY release_year DESC NULLS LAST
                   LIMIT 1""",
                (f"%{normalized}%", f"%{normalized.replace('-', ' ')}%")
            )
            
            phone = cursor.fetchone()
            
            if not phone:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Phone not found: {slug}"
                )
            
            phones.append(dict(phone))
    
    # Get stats for all phones
    for phone in phones:
        phone['stats'] = get_phone_stats_cached(phone['id'])
    
    return {
        "success": True,
        "phones": phones,
        "comparison_count": len(phones)
    }


@app.get("/sitemap.xml")
def generate_sitemap():
    """Generate dynamic sitemap for SEO"""
    with get_phones_db() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """SELECT brand, model_name, updated_at 
               FROM phones 
               WHERE brand IS NOT NULL 
               AND model_name IS NOT NULL
               ORDER BY updated_at DESC"""
        )
        phones = cursor.fetchall()
    
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>']
    sitemap.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add homepage
    sitemap.append('''
    <url>
        <loc>https://mobylite.vercel.app/</loc>
        <priority>1.0</priority>
        <changefreq>daily</changefreq>
    </url>
    ''')
    
    # Add phone pages
    for phone in phones:
        brand_slug = phone['brand'].lower().replace(' ', '-')
        model_slug = phone['model_name'].lower().replace(' ', '-')
        model_slug = ''.join(c if c.isalnum() or c == '-' else '' for c in model_slug)
        
        lastmod = phone.get('updated_at')
        lastmod_str = lastmod.strftime('%Y-%m-%d') if lastmod else ''
        
        sitemap.append(f'''
    <url>
        <loc>https://mobylite.vercel.app/{brand_slug}/{model_slug}</loc>
        <lastmod>{lastmod_str}</lastmod>
        <priority>0.8</priority>
        <changefreq>weekly</changefreq>
    </url>
        ''')
    
    sitemap.append('</urlset>')
    
    from fastapi.responses import Response
    return Response(content=''.join(sitemap), media_type="application/xml")
