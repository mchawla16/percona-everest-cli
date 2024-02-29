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

//This test assumes that the everest is installed
test.describe('Everest Cli uninstall', async () => {
   test.beforeEach(async ({ cli }) => {
     const clusteravailableOut = await cli.exec('kubectl get pods --namespace=everest-system');
     await clusteravailableOut.assertSuccess();
     await clusteravailableOut.outContainsNormalizedMany([
      'everest-operator-controller-manager',
    ]);
    
   });

  test('uninstall everest and all namespaces', async ({ page, cli, request }) => {

    await test.step('run everest uninstall command', async () => {
      const out = await cli.everestExec(
        `uninstall --assume-yes`,
      );

      await out.assertSuccess();
      //await out.outErrContainsNormalizedMany([
      //  'percona-xtradb-cluster-operator operator has been installed',
      //  'everest-operator operator has been installed',
      //]);
      console.log(out.stdout);
      //console.log(out.stderr);

      // check that the namespace does not exist
      nsStatus = await cli.exec('kubectl get ns everest-system everest-monitoring everest-olm everest-all');

      await nsStatus.outErrContainsNormalizedMany([
        'Error from server (NotFound): namespaces "everest-system" not found',
		    'Error from server (NotFound): namespaces "everest-monitoring" not found',
        'Error from server (NotFound): namespaces "everest-olm" not found',
        'Error from server (NotFound): namespaces "everest-all" not found',
      ]);
    });

    await page.waitForTimeout(10_000);
  });
});