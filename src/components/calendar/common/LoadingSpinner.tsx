export const LoadingSpinner: React.FC = () => {
  return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};
