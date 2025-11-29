import React from 'react';
import { Container } from '@/components/layout/Container';
import { Card, Badge, Button } from '@/components/ui';
import { Filter, Grid, List } from 'lucide-react';

const Products: React.FC = () => {
  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Todos los Productos</h1>
          <p className="text-text-secondary">
            Explora nuestra colección completa de ropa deportiva
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 bg-surface rounded-lg">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Filter />}>
              Filtros
            </Button>
            <Badge variant="default">12 productos</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Grid className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Products Grid (Placeholder) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} hoverable>
              <div className="aspect-square bg-surface-light rounded-t-lg mb-4" />
              <div className="space-y-2 p-4">
                <Badge variant="primary" size="sm">Nuevo</Badge>
                <h3 className="font-semibold text-lg">Producto {i + 1}</h3>
                <p className="text-text-secondary text-sm">Descripción breve del producto</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-bold text-primary">$99.99</span>
                  <Button size="sm">Agregar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        <div className="text-center py-20 hidden">
          <p className="text-text-secondary text-lg mb-4">
            Próximamente: Listado completo de productos
          </p>
          <p className="text-text-tertiary">
            Esta sección estará disponible cuando se implemente la integración con el backend
          </p>
        </div>
      </Container>
    </div>
  );
};

export default Products;
