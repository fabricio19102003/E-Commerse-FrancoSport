/**
 * UI Components Library
 * Franco Sport E-Commerce
 * 
 * Base components siguiendo el sistema de diseño (RI-002)
 */

// Core Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './Card';

export { Modal, ConfirmModal } from './Modal';
export type { ModalProps, ConfirmModalProps } from './Modal';

export { Spinner, PageSpinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

// Product Components
export { default as ProductCard } from './ProductCard';

// Cart Components
export { default as CartDrawer } from './CartDrawer';

// Re-export commonly used icons from lucide-react
export {
  User,
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info,
  Loader2,
  LogOut,
  Settings,
  Package,
  CreditCard,
  Truck,
  MapPin,
  Mail,
  Phone,
  Star,
  Filter,
} from 'lucide-react';
