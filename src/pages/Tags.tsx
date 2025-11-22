import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/appStore';
import { CategoryService, TagService } from '../services';
import { Tag as TagIcon, Folder, Plus, Pencil, Trash2, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Category, Tag } from '../types';

const COLORS = [
  { name: 'Vermelho', value: 'red' },
  { name: 'Laranja', value: 'orange' },
  { name: 'Amarelo', value: 'yellow' },
  { name: 'Verde', value: 'green' },
  { name: 'Azul', value: 'blue' },
  { name: 'Roxo', value: 'purple' },
  { name: 'Rosa', value: 'pink' },
  { name: 'Cinza', value: 'gray' },
];

const Tags: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<Category | Tag | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'tag' | 'category', id: string, name: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    color: 'blue',
    icon: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        CategoryService.getAll(user!.id),
        TagService.getAll(user!.id)
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar tags e categorias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTagDialog = (tag?: Tag) => {
    if (tag) {
      setEditingItem(tag);
      setFormData({ name: tag.name, color: tag.color, icon: '' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', color: 'blue', icon: '' });
    }
    setIsTagDialogOpen(true);
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingItem(category);
      setFormData({ name: category.name, color: category.color, icon: category.icon || '' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', color: 'blue', icon: '' });
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    try {
      if (editingItem) {
        const updatedTag = await TagService.update(editingItem.id, {
          name: formData.name,
          color: formData.color
        });
        setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t));
        toast.success('Tag atualizada com sucesso');
      } else {
        const newTag = await TagService.create({
          name: formData.name,
          color: formData.color
        }, user!.id);
        setTags([...tags, newTag]);
        toast.success('Tag criada com sucesso');
      }
      setIsTagDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      toast.error('Erro ao salvar tag');
    }
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    try {
      if (editingItem) {
        const updatedCategory = await CategoryService.update(editingItem.id, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon || undefined
        });
        setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        toast.success('Categoria atualizada com sucesso');
      } else {
        const newCategory = await CategoryService.create({
          name: formData.name,
          color: formData.color,
          icon: formData.icon || undefined
        }, user!.id);
        setCategories([...categories, newCategory]);
        toast.success('Categoria criada com sucesso');
      }
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDeleteClick = (type: 'tag' | 'category', item: Tag | Category) => {
    setDeleteItem({ type, id: item.id, name: item.name });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      if (deleteItem.type === 'tag') {
        await TagService.delete(deleteItem.id);
        setTags(tags.filter(t => t.id !== deleteItem.id));
        toast.success('Tag removida com sucesso');
      } else {
        await CategoryService.delete(deleteItem.id);
        setCategories(categories.filter(c => c.id !== deleteItem.id));
        toast.success('Categoria removida com sucesso');
      }
      setIsDeleteDialogOpen(false);
      setDeleteItem(null);
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Erro ao remover item');
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorClass = (color: string) => {
    const map: Record<string, string> = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return map[color] || map.gray;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags e Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Organize suas tarefas com marcadores personalizados
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tags">
            <TagIcon className="mr-2 h-4 w-4" />
            Tags ({tags.length})
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Folder className="mr-2 h-4 w-4" />
            Categorias ({categories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4 border-dashed flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors min-h-[100px]" onClick={() => handleOpenTagDialog()}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Plus className="h-8 w-8" />
                  <span className="font-medium">Nova Tag</span>
                </div>
              </Card>

              {filteredTags.map((tag) => (
                <Card key={tag.id} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full bg-${tag.color}-500`} />
                    <div>
                      <Badge variant="outline" className={`${getColorClass(tag.color)} border-0`}>
                        {tag.name}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tag.usageCount || 0} tarefas
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenTagDialog(tag)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick('tag', tag)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4 border-dashed flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors min-h-[100px]" onClick={() => handleOpenCategoryDialog()}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Plus className="h-8 w-8" />
                  <span className="font-medium">Nova Categoria</span>
                </div>
              </Card>

              {filteredCategories.map((category) => (
                <Card key={category.id} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getColorClass(category.color)}`}>
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      {category.isSystem && (
                        <Badge variant="secondary" className="text-[10px] h-5 mt-1">
                          Sistema
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!category.isSystem && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick('category', category)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Tag */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
            <DialogDescription>
              Crie tags para organizar suas tarefas por contexto, prioridade ou tipo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome</Label>
              <Input
                id="tag-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Urgente, Bug, Feature..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full bg-${color.value}-500 hover:ring-2 ring-offset-2 ring-offset-background ring-${color.value}-500 transition-all ${formData.color === color.value ? 'ring-2' : ''
                      }`}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTag}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Categoria */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              Categorias ajudam a agrupar tarefas em grandes áreas ou projetos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Trabalho, Pessoal, Estudos..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full bg-${color.value}-500 hover:ring-2 ring-offset-2 ring-offset-background ring-${color.value}-500 transition-all ${formData.color === color.value ? 'ring-2' : ''
                      }`}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Delete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteItem?.type === 'tag' ? 'Tag' : 'Categoria'}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteItem?.name}</strong>?
              Esta ação não pode ser desfeita e removerá este marcador de todas as tarefas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tags;
