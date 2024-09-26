import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
  loading: () => <p>Loading map...</p>,
  ssr: false
});

export default Map;
