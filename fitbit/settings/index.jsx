function BailOut(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Bail Out</Text>}>
        <TextInput
          label="Phone Number"
          settingsKey="phoneNumber"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(BailOut);