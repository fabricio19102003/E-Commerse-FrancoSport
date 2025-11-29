import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from './Container';
import { ROUTES } from '@/constants/routes';
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    empresa: [
      { label: 'Sobre Nosotros', path: '/sobre-nosotros' },
      { label: 'Contacto', path: '/contacto' },
      { label: 'Trabaja con Nosotros', path: '/trabaja-con-nosotros' },
      { label: 'Blog', path: '/blog' },
    ],
    ayuda: [
      { label: 'Preguntas Frecuentes', path: '/faq' },
      { label: 'Métodos de Pago', path: '/metodos-pago' },
      { label: 'Envíos y Devoluciones', path: '/envios-devoluciones' },
      { label: 'Guía de Tallas', path: '/guia-tallas' },
    ],
    legal: [
      { label: 'Términos y Condiciones', path: '/terminos' },
      { label: 'Política de Privacidad', path: '/privacidad' },
      { label: 'Política de Cookies', path: '/cookies' },
      { label: 'Libro de Reclamaciones', path: '/reclamaciones' },
    ],
  };

  return (
    <footer className="bg-surface border-t border-surface-lighter mt-auto">
      <Container>
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">
              Franco Sport
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              "No es suerte, es esfuerzo"
            </p>
            <p className="text-text-tertiary text-sm">
              Tu tienda de confianza para ropa deportiva de alta calidad.
            </p>

            {/* Social Media */}
            <div className="flex gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-surface-light hover:bg-primary hover:text-white transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-surface-light hover:bg-primary hover:text-white transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-surface-light hover:bg-primary hover:text-white transition-all"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              Empresa
            </h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              Ayuda
            </h4>
            <ul className="space-y-2">
              {footerLinks.ayuda.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-text-secondary text-sm">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Cobija, Pando, Bolivia</span>
              </li>
              <li className="flex items-center gap-2 text-text-secondary text-sm">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a
                  href="tel:+59100000000"
                  className="hover:text-primary transition-colors"
                >
                  +591 0000 0000
                </a>
              </li>
              <li className="flex items-center gap-2 text-text-secondary text-sm">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:contacto@francosport.com"
                  className="hover:text-primary transition-colors"
                >
                  contacto@francosport.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-surface-lighter">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-tertiary text-sm text-center md:text-left">
              © {currentYear} Franco Sport. Todos los derechos reservados.
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4">
              {footerLinks.legal.map((link, index) => (
                <React.Fragment key={link.path}>
                  <Link
                    to={link.path}
                    className="text-text-tertiary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                  {index < footerLinks.legal.length - 1 && (
                    <span className="text-text-tertiary">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Developer Credit */}
          <p className="text-text-tertiary text-xs text-center mt-4">
            Desarrollado por Pedro Fabricio
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
