<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <!-- <base-v-component
      heading="Simple Tables"
      link="components/simple-tables"
    /> -->

    <base-material-card
      inline
      icon="mdi-check-outline"
      title="運営TODO"
      class="px-5 py-3"
    >
      <v-simple-table>
        <thead>
          <tr>
            <th class="primary--text pa-0">
              STEP
            </th>
            <th class="primary--text">
              TODO
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>STEP1</td>
            <td
              class="py-5"
            >
              店舗を管理する。
            </td>
          </tr>
          <tr>
            <td>STEP2</td>
            <td
              class="py-5"
            >
              イベントを管理する。
            </td>
          </tr>
          <tr>
            <td>STEP3</td>
            <td
              class="py-5"
            >
              支払いを管理する。
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>
  </v-container>
</template>
