"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Map error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="h-full w-full flex items-center justify-center bg-background">
            <div className="text-center p-6 max-w-md">
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="font-semibold mb-2">Не удалось загрузить карту</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Произошла ошибка при инициализации карты. Попробуйте обновить
                страницу.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Обновить
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
