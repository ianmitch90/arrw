import { Card, CardBody } from '@nextui-org/react';
import { Profile } from '../types/profile'; // Updated import

export default function UserCard({ profile }: { profile: Profile }) {
  return (
    <div>
      <Card>
        <CardBody>
          <h3>{profile.display_name || profile.username}</h3>
          <p>{profile.bio}</p>
        </CardBody>
      </Card>
    </div>
  );
}
