import React from 'react';
import './AboutPage.css';

/* ─── Team data ─────────────────────────────────────────────────────────── */
const team = [
  {
    id: 'ahmed',
    photo: '/ahmedkhoga.png',
    nameEn: 'Ahmed Khoga',
    nameAr: 'أحمد خوجة',
    roleEn: 'Founder & Visionary',
    roleAr: 'المؤسس وصاحب الرؤية',
    bioEn:
      'The heart and soul of KHOGA. Ahmed built the brand from the ground up — from the factory floor to every carefully crafted blend. Since 2019, his unwavering passion for quality coffee has shaped every roast, every product, and every cup.',
    bioAr:
      'هو الروح والأساس اللي بُنيت عليه خوجة. أحمد بنى البراند من الصفر — من المصنع لكل تجربة قهوة. شغفه بالجودة من 2019 هو اللي بيشكّل كل حبة بن وكل كوباية.',
  },
  {
    id: 'sherif',
    photo: '/sherifkhoga.png',
    nameEn: 'Sherif Khoga',
    nameAr: 'شريف خوجة',
    roleEn: 'Co-founder & Software Engineer',
    roleAr: 'الشريك المؤسس ومهندس البرمجيات',
    bioEn:
      'The tech mind behind the experience. Sherif engineered the digital side of KHOGA — building the platform that brings the finest coffee straight to your door. Where code meets coffee, he makes sure every click is as smooth as every sip.',
    bioAr:
      'العقل التقني وراء التجربة. شريف هو اللي بنى الجانب الرقمي لخوجة — صمّم المنصة اللي توصّل القهوة لبيتك. عنده كل كليكة بتبقى بنفس سلاسة الكوباية.',
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <main className="about-page">

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav className="about-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="about-breadcrumb-sep">›</span>
        <span>About Us</span>
      </nav>

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-noise" aria-hidden="true" />
        <div className="about-hero-inner">
          <span className="about-hero-eyebrow">Since 2019</span>
          <h1 className="about-hero-title">
            The People Behind KHOGA
            <span className="about-hero-title-ar" lang="ar">الأشخاص خلف خوجة</span>
          </h1>
          <div className="about-hero-divider" aria-hidden="true">
            <span className="about-hero-divider-line" />
            <span className="about-hero-divider-icon">☕</span>
            <span className="about-hero-divider-line" />
          </div>
          <p className="about-hero-sub">
            A family story built on passion, craft, and an uncompromising love for exceptional coffee.
          </p>
        </div>
      </section>

      {/* ── Team cards ──────────────────────────────────────────────────── */}
      <section className="about-team-section">
        <div className="about-team-grid">
          {team.map((member) => (
            <article key={member.id} className="about-team-card">

              {/* Photo */}
              <div className="about-card-photo-wrap">
                <img
                  src={member.photo}
                  alt={member.nameEn}
                  className="about-card-photo"
                  loading="lazy"
                />
                <div className="about-card-photo-overlay" aria-hidden="true" />
              </div>

              {/* Info */}
              <div className="about-card-body">
                {/* Role tag */}
                <span className="about-card-role-tag">{member.roleEn}</span>

                {/* Names */}
                <div className="about-card-names">
                  <h2 className="about-card-name-en">{member.nameEn}</h2>
                  <p className="about-card-name-ar" lang="ar" dir="rtl">
                    {member.nameAr}
                  </p>
                  <p className="about-card-role-ar" lang="ar" dir="rtl">
                    {member.roleAr}
                  </p>
                </div>

                {/* Divider */}
                <div className="about-card-divider" aria-hidden="true" />

                {/* Bios */}
                <p className="about-card-bio-en">{member.bioEn}</p>
                <p className="about-card-bio-ar" lang="ar" dir="rtl">
                  {member.bioAr}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Brand Story ─────────────────────────────────────────────────── */}
      <section className="about-story-section">
        <div className="about-story-inner">

          {/* Decorative beans */}
          <div className="about-story-decoration" aria-hidden="true">
            <span className="about-deco-bean about-deco-bean--1" />
            <span className="about-deco-bean about-deco-bean--2" />
            <span className="about-deco-bean about-deco-bean--3" />
          </div>

          <div className="about-story-badge">Our Story</div>

          <blockquote className="about-story-quote">
            <p className="about-story-text-en">
              KHOGA is more than a coffee brand — it's a family story. Built on a shared love
              for exceptional coffee and a drive to bring it to every Egyptian home, we combine
              decades of roasting heritage with a modern digital experience.{' '}
              <strong>One blend. One promise. Eight years strong.</strong>
            </p>
            <p className="about-story-text-ar" lang="ar" dir="rtl">
              خوجة مش مجرد براند قهوة — دي قصة عيلة. اتبنت على حب مشترك للقهوة الاستثنائية
              ورغبة في إنها توصل لكل بيت مصري. بنجمع بين إرث التحميص والتجربة الرقمية الحديثة.{' '}
              <strong>بلندة واحدة. ووعد واحد. وثمانية سنين صح.</strong>
            </p>
          </blockquote>

          {/* Stats row */}
          <div className="about-story-stats">
            {[
              { num: '2019', label: 'Founded', labelAr: 'تأسست' },
              { num: '7+', label: 'Product Lines', labelAr: 'خطوط منتجات' },
              { num: '8', label: 'Years of Craft', labelAr: 'سنوات من الصنعة' },
              { num: '100%', label: 'Egyptian Made', labelAr: 'صنع في مصر' },
            ].map((s) => (
              <div key={s.num} className="about-stat">
                <span className="about-stat-num">{s.num}</span>
                <span className="about-stat-label">{s.label}</span>
                <span className="about-stat-label-ar" lang="ar" dir="rtl">
                  {s.labelAr}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="about-cta-section">
        <div className="about-cta-inner">
          <p className="about-cta-text">
            Taste the story — explore our full collection.
          </p>
          <a href="/collections/bundles" className="about-cta-btn">
            Shop KHOGA
          </a>
        </div>
      </section>

    </main>
  );
}
