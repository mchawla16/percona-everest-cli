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
   });

  test('install different operators in multiple namespaces', async ({ page, cli, request }) => {
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

        const mysqlOut = await cli.exec('kubectl get pods --namespace=mysql');

        await mysqlOut.outContainsNormalizedMany([
          'percona-xtradb-cluster-operator'
        ]);

        await mysqlOut.outNotContains([
          'percona-server-mongodb-operator',
          'percona-postgresql-operator'
        ]);

        const mongodbOut = await cli.exec('kubectl get pods --namespace=mongodb');

        await mongodbOut.outContainsNormalizedMany([
          'percona-server-mongodb-operator'
        ]);

        await mongodbOut.outNotContains([
          'percona-xtradb-cluster-operator',
          'percona-postgresql-operator'
        ]);

        const postgresOut = await cli.exec('kubectl get pods --namespace=mongodb');

        await postgresOut.outContainsNormalizedMany([
          'percona-postgresql-operator'
        ]);

        await postgresOut.outNotContains([
          'percona-xtradb-cluster-operator',
          'percona-server-mongodb-operator'
        ]);

      });
    };

    await test.step('run everest install command', async () => {
      //Install the mysql operator in mysql namespace
      const out = await cli.everestExecSkipWizard(
        `install --operator.mongodb=false --operator.postgresql=false --operator.xtradb-cluster=true --namespaces=mysql`,
      );

      await out.assertSuccess();
      
      await out.outErrContainsNormalizedMany([
        'percona-xtradb-cluster-operator operator has been installed',
        'everest-operator operator has been installed',
      ]);

      await out.outContainsNormalizedMany([
        'percona-xtradb-cluster-operator',
      ]);

      await out.outNotContains([
        'percona-server-mongodb-operator',
        'percona-postgresql-operator',
      ]);

      //Install the mongodb operator in mongodb namespace
      out = await cli.everestExecSkipWizard(
        `install --operator.mongodb=true --operator.postgresql=false --operator.xtradb-cluster=false --namespaces=mongodb`,
      );

      await out.assertSuccess();
      
      await out.outErrContainsNormalizedMany([
        'percona-server-mongodb-operator operator has been installed',
        'everest-operator operator has been installed',
      ]);

      await out.outContainsNormalizedMany([
        'percona-server-mongodb-operator',
      ]);

      await out.outNotContains([
        'percona-xtradb-cluster-operator',
        'percona-postgresql-operator',
      ]);

      //Install the postgres operator in postgres namespace
      out = await cli.everestExecSkipWizard(
        `install --operator.mongodb=false --operator.postgresql=true --operator.xtradb-cluster=false --namespaces=postgres`,
      );

      await out.assertSuccess();
      
      await out.outErrContainsNormalizedMany([
        'percona-postgresql-operator operator has been installed',
        'everest-operator operator has been installed',
      ]);

      await out.outContainsNormalizedMany([
        'percona-postgresql-operator',
      ]);

      await out.outNotContains([
        'percona-xtradb-cluster-operator',
        'percona-server-mongodb-operator',
      ]);

    });

    await page.waitForTimeout(10_000);

    await verifyClusterResources();
  });
});