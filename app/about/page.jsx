'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Users, Target, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl md:text-6xl text-brand mb-6">
              About Yama Vista
            </h1>
            <p className="text-lg text-brand-gray leading-relaxed">
              We're on a mission to make Japanese real estate investment accessible, transparent, and profitable for international investors. Since our founding, we've helped hundreds of people find their perfect property in Japan.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="font-serif text-4xl text-brand mb-6">Our Story</h2>
              <p className="text-brand-gray mb-4 leading-relaxed">
                Hey, my name is Elio. I've been living in Japan for about three years, and I've worked with different companies in marketing and also the real estate industry, assisting people with buying and managing homes in Japan and also renovating them.
              </p>
              <p className="text-brand-gray mb-4 leading-relaxed">
                I personally own three properties in Japan, and I created Yama Vista in order to help those who live abroad and would like to purchase their dream home in Japan. I assist with renovations and answer any questions they may have throughout the entire process.
              </p>
              <p className="text-brand-gray mb-4 leading-relaxed">
                There's a lot of different nuances in Japan's real estate market that people may not know about—things you need to account for that can make or break a deal. That's where we come in.
              </p>
              <p className="text-brand-gray leading-relaxed">
                I highly recommend booking a free consultation, and we can help you get your dream home in Japan.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-brand shadow-lg">
                <Image
                  src="/elio-profile.jpg"
                  alt="Elio Bardho, Founder"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="font-serif text-4xl text-brand text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Target,
                title: 'Transparency',
                description:
                  'No hidden fees, no surprises. We tell you exactly what to expect.',
              },
              {
                icon: Heart,
                title: 'Integrity',
                description:
                  'We recommend properties we believe in, not just ones that make us money.',
              },
              {
                icon: Users,
                title: 'Community',
                description:
                  'Your success is our success. We build relationships, not transactions.',
              },
              {
                icon: CheckCircle,
                title: 'Excellence',
                description:
                  'We sweat the details so you don\'t have to. Quality in everything.',
              },
            ].map((value, idx) => (
              <div key={idx} className="text-center">
                <value.icon className="h-10 w-10 text-brand-accent mx-auto mb-4" />
                <h3 className="font-serif text-lg text-brand mb-2">{value.title}</h3>
                <p className="text-sm text-brand-gray leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '100+', label: 'Properties Listed' },
              { number: '500+', label: 'Active Members' },
              { number: '15+', label: 'Years Experience' },
              { number: '¥5B+', label: 'Total Value Invested' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="font-serif text-4xl md:text-5xl text-brand mb-2">
                  {stat.number}
                </div>
                <p className="text-sm text-brand-gray">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="font-serif text-4xl text-brand text-center mb-12">
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Elio Bardho',
                role: 'Founder & Lead Consultant',
                bio: 'Real estate investor with 15+ years in the Japanese market. Specializes in akiya and high-yield properties.',
              },
              {
                name: 'Local Partners',
                role: 'Property Inspectors & Consultants',
                bio: 'Our network of trusted local experts handle inspections, negotiations, and legal work in every region.',
              },
              {
                name: 'Community Moderators',
                role: 'Member Support Team',
                bio: 'Experienced investors who help members navigate challenges and share best practices.',
              },
            ].map((member, idx) => (
              <div key={idx} className="border border-brand-border p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-brand mx-auto mb-4 flex items-center justify-center text-white text-2xl font-serif">
                  {member.name.split(' ')[0][0]}
                  {member.name.split(' ')[1]?.[0]}
                </div>
                <h3 className="font-serif text-xl text-brand mb-1">{member.name}</h3>
                <p className="text-sm text-brand-accent mb-3">{member.role}</p>
                <p className="text-sm text-brand-gray">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand text-white text-center">
        <div className="container-custom">
          <h2 className="font-serif text-4xl mb-4">Ready to get started?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Schedule a free consultation with our team to discuss your Japan real estate goals.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand font-medium transition-base hover:bg-brand-light"
          >
            Book Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
