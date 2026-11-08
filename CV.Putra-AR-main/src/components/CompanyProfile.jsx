import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, PackageCheck, Sparkles, UsersRound } from 'lucide-react';

const profileHighlights = [
  {
    title: 'Our mission',
    text: 'Reliable essentials for smoother business days.',
    icon: PackageCheck,
    tone: 'blue',
  },
  {
    title: 'Our vision',
    text: 'A brighter world shaped by creativity and fun.',
    icon: Sparkles,
    tone: 'violet',
  },
  {
    title: 'Why Outjourney',
    text: 'Save time. Spend smarter. Keep moving forward.',
    icon: Lightbulb,
    tone: 'amber',
  },
  {
    title: 'Made for',
    text: 'Growing businesses, creative minds, and curious people.',
    icon: UsersRound,
    tone: 'green',
  },
];

export const CompanyProfile = () => (
  <section className="section-profile" id="profile">
    <div className="profile-modern-layout">
      <motion.div
        className="profile-modern-intro"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="profile-eyebrow">A little about us</span>
        <h2 className="profile-heading">
          Good business starts with <em className="italic">good ideas.</em>
        </h2>
        <p>
          Everyday essentials and fresh thinking, brought together to help you
          move forward.
        </p>
      </motion.div>

      <motion.div
        className="profile-highlight-grid"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {profileHighlights.map(({ title, text, icon: Icon, tone }) => (
          <article className={`profile-highlight profile-highlight-${tone}`} key={title}>
            <div className="profile-highlight-art" aria-hidden="true">
              <span className="profile-highlight-orbit" />
              <Icon />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </motion.div>
    </div>
  </section>
);
