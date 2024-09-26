import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/react';

const ARView = () => {
  return (
    <Card>
      <CardHeader>
        <h1>AR View</h1>
      </CardHeader>
      <CardBody>
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
          <OrbitControls />
        </Canvas>
      </CardBody>
    </Card>
  );
};

export default ARView;
