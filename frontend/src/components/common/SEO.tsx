import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title = 'Fashion Store - Thời trang chính hãng', 
  description = 'Mua sắm thời trang nam nữ, phụ kiện chính hãng với giá tốt nhất tại Fashion Store.',
  image = '/logo_wordmark_serif.png',
  url,
  type = 'website'
}) => {
  const siteUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  const fullTitle = title.includes('Fashion Store') ? title : `${title} | Fashion Store`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Fashion Store" />

      {/* Twitter tags */}
      <meta name="twitter:creator" content="@fashionstore" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
    </Helmet>
  );
};

export default SEO;
