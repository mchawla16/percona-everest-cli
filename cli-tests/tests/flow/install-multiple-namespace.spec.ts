// Copyright (C) 2023 Percona LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { test } from '@fixtures';

//This test assumes that the eks/gke cluster is created and available
test.describe('Everest CLI install', async () => {
   test.beforeEach(async ({ cli }) => {
     const clusteravailableOut = await cli.exec('kubectl get nodes');
     await clusteravailableOut.assertSuccess();
    // console.log(clusteravailableOut.stdout);
   });

  test('install all operators in multiple namespaces', async ({ page, cli, request }) => {
    const verifyClusterResources = async () => {
      await test.step('verify installed operators in k8s', async () => {
        const perconaEverestPodsOut = await cli.exec('kubectl get pods --namespace=everest-system');

        await perconaEverestPodsOut.outContainsNormalizedMany([
          'everest-operator-controller-manager',
        ]);

        const monitoringPodsOut = await cli.exec('kubectl get pods --namespace=everest-monitoring');

        await monitoringPodsOut.outContainsNormalizedMany([
          'kube-state-metrics',
          'vm-operator-vm-operator'
        ]);

        const namespace1Out = await cli.exec('kubectl get pods --namespace=namespace1');

        await namespace1Out.outContainsNormalizedMany([
          'percona-xtradb-cluster-operator',
          'percona-server-mongodb-operator',
          'percona-postgresql-operator',
        ]);

        const namespace2Out = await cli.exec('kubectl get pods --namespace=namespace2');

        await namespace2Out.outContainsNormalizedMany([
          'percona-xtradb-cluster-operator',
          'percona-server-mongodb-operator',
          'percona-postgresql-operator',
        ]);

      });
    };

    await test.step('run everest install command', async () => {
      const out = await cli.everestExecSkipWizard(
        `install --operator.mongodb=true --operator.postgresql=true --operator.xtradb-cluster=true --namespaces=namespace1,namespace2`,
      );

      await out.assertSuccess();
      console.log(out.stdout);
      //console.log(out.stderr);
    });

    await page.waitForTimeout(10_000);

    await verifyClusterResources();
  });
});