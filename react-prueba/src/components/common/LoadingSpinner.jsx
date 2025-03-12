const LoadingSpinner = () => {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        <p className="mt-4 text-gray-600 animate-pulse">Loading, please wait...</p>
      </div>
    );
  };
  
  export default LoadingSpinner;
  