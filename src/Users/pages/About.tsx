// src/pages/AboutUs.tsx
import React from "react";
import { useTranslation } from 'react-i18next';

const AboutUs: React.FC = () => {
  const { t, i18n } = useTranslation();
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={pageDirection} className={`about-us-page-wrapper lang-${i18n.language}`}>
      <main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6"> {/* Adjusted padding for responsiveness */}
        {/* Removed 'small' class, controlling text size with Tailwind utilities directly */}
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-8 md:space-y-10">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-600"> {/* Responsive Title */}
              {t('aboutUsPage.perspective.title', 'Our Perspective')}
            </h2>
            <p className="text-gray-600 mt-2 text-md sm:text-lg"> {/* Responsive Subtitle */}
              {t('aboutUsPage.perspective.subtitle', 'A deeper look!')}
            </p>
          </div>

          {/* Removed 'small' class from sections */}
          <section className="p-4 sm:p-5 bg-white shadow rounded mt-5"> {/* Responsive Padding */}
            <h3 className="text-xl sm:text-2xl font-semibold text-yellow-500 mb-3"> {/* Responsive Section Title */}
              {t('aboutUsPage.vision.title', 'Vision')}
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base"> {/* Responsive Paragraph */}
              {t('aboutUsPage.vision.text', 'To be the preferred and most differentiated shopping destination, both locally and regionally.')}
            </p>
          </section>

          <section className="p-4 sm:p-5 bg-white shadow rounded mt-5">
            <h3 className="text-xl sm:text-2xl font-semibold text-yellow-500 mb-4">
              {t('aboutUsPage.setsUsApart.title', 'What Sets Us Apart')}
            </h3>
            <ul className="space-y-3 list-disc list-inside text-gray-700 text-sm sm:text-base"> {/* Responsive List & Text */}
              <li>{t('aboutUsPage.setsUsApart.item1', 'We are local and convenient.')}</li>
              <li>{t('aboutUsPage.setsUsApart.item2', 'Attentive employees and a wide range of services.')}</li>
              <li>{t('aboutUsPage.setsUsApart.item3', 'High-quality products that exceed expectations.')}</li>
              <li>{t('aboutUsPage.setsUsApart.item4', 'Eco-friendly practices for community and customers.')}</li>
              <li>{t('aboutUsPage.setsUsApart.item5', 'One-stop solution for all shopping needs.')}</li>
            </ul>
          </section>

          <section className="p-4 sm:p-5 bg-white shadow rounded mt-5">
            <h3 className="text-xl sm:text-2xl font-semibold text-yellow-500 mb-3">
              {t('aboutUsPage.mission.title', 'Our Mission')}
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base"> {/* Responsive Paragraph */}
              {t('aboutUsPage.mission.intro', 'To offer a valuable, multi-optional shopping experience through:')}
            </p>
            <ul className="space-y-3 list-disc list-inside text-gray-700 text-sm sm:text-base"> {/* Responsive List & Text */}
              <li>{t('aboutUsPage.mission.item1', 'Premium, continually updated products.')}</li>
              <li>{t('aboutUsPage.mission.item2', 'Outstanding customer service.')}</li>
              <li>{t('aboutUsPage.mission.item3', 'Motivated and skilled team.')}</li>
              <li>{t('aboutUsPage.mission.item4', 'Eco-friendly operations.')}</li>
              <li>{t('aboutUsPage.mission.item5', 'Trusted partnerships with suppliers.')}</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;