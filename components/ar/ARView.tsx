import React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Box, useHelper } from '@react-three/drei';
import { Card, CardHeader, CardBody } from '@heroui/react';
import { PointLight, PointLightHelper } from 'three';

const Scene = () => {
  const { camera } = useThree();
  const lightRef = React.useRef<PointLight>(null);
  
  // useHelper( PointLightHelper);
  camera.position.z = 5;

  return (
    <>
      {/* <pointLight ref={lightRef} position={[10, 10, 10]} intensity={1.5} /> */}
      <Box position={[0, -1.5, 0]} args={[1, 1, 1]}>
        {/* <meshStandardMaterial color="orange" /> */}
      </Box>
      <OrbitControls />
    </>
  );
};

const ARView = () => {
  return (
    <Card>
      <CardHeader>
        <h1>AR View</h1>
      </CardHeader>
      <CardBody>
        <Canvas>
          <Scene />
        </Canvas>
      </CardBody>
    </Card>
  );
};

export default ARView;
