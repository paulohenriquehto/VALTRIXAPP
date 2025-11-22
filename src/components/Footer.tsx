import React from 'react';
import { Github, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>© {currentYear} TaskFlow Manager</span>
            <span>•</span>
            <span>Feito com</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>por TaskFlow Team</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/taskflow-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
            
            <div className="text-xs text-gray-500 dark:text-gray-500">
              v1.0.0
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;