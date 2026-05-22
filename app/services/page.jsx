import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { services } from '@/data/services';

export const metadata = {
  title: 'Services — Japan Property Inspection, Management & Consulting',
  description:
    'Pre-purchase home inspection, property management, and free initial consultations for Japan real estate. Expert services for international investors buying akiya and houses in Japan.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Services — Japan Cheap Houses',
    description: 'Inspection, management, and consulting for Japan real estate.',
    url: '/services',
  },
};

export default function ServicesPage() {
  return (
    <div className="pt-24">
      {/* Header */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="font-serif text-5xl md:text-6xl text-brand mb-4">Our Services</h1>
            <p className="text-brand-gray max-w-2xl mx-auto">
              Comprehensive real estate services tailored for international buyers exploring Japan.
            </p>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-brand-border overflow-hidden card-hover flex flex-col"
              >
                <div className="relative h-64">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-serif text-2xl text-brand mb-3">{service.title}</h3>
                  <div className="w-full h-px bg-brand-border mb-4" />
                  <p className="text-sm text-brand-gray mb-2">{service.duration}</p>
                  {service.price !== 'Contact for pricing' && (
                    <p className="text-brand text-lg font-medium mb-4">{service.price}</p>
                  )}
                  <p className="text-sm text-brand-gray mb-4">{service.description}</p>

                  <ul className="space-y-2 mb-6 flex-grow">
                    {service.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start text-sm text-brand-gray"
                      >
                        <Check className="h-4 w-4 text-brand-accent mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-col gap-2">
                    <Link
                      href="/booking"
                      className="btn-primary w-full text-center"
                    >
                      {service.id === 'consultation' ? 'Request to Book' : 'Book Now'}
                    </Link>
                    {service.bookingType === 'plans' && (
                      <Link
                        href="/pricing"
                        className="text-sm text-brand underline hover:text-brand-accent text-center"
                      >
                        Explore Plans
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Services CTA */}
      <section className="section-padding bg-brand-light">
        <div className="container-custom text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-brand mb-4">
            Need Something Different?
          </h2>
          <p className="text-brand-gray max-w-2xl mx-auto mb-8">
            We offer custom services for unique situations. Reach out to discuss your specific needs.
          </p>
          <Link href="/booking" className="btn-primary">
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
