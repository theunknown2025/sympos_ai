import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'config', 'sections.json');
const outDir = path.join(root, 'test-plans');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function httpSampler(testName, urlPath) {
  const name = xmlEscape(`GET ${urlPath}`);
  return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${name}" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.path">${xmlEscape(urlPath)}</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response OK" enabled="true">
            <collectionProp name="Assertion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>
        </hashTree>`;
}

function buildJmx(section, defaults) {
  const samplers = section.paths.map((p) => httpSampler(p, p)).join('\n');
  const testName = xmlEscape(`Sympos-ia — ${section.name}`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${testName}" enabled="true">
      <stringProp name="TestPlan.comments">${xmlEscape(section.description)}</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_PROTOCOL" elementType="Argument">
            <stringProp name="Argument.name">BASE_PROTOCOL</stringProp>
            <stringProp name="Argument.value">\${__P(BASE_PROTOCOL,${defaults.baseProtocol})}</stringProp>
          </elementProp>
          <elementProp name="BASE_HOST" elementType="Argument">
            <stringProp name="Argument.name">BASE_HOST</stringProp>
            <stringProp name="Argument.value">\${__P(BASE_HOST,${defaults.baseHost})}</stringProp>
          </elementProp>
          <elementProp name="BASE_PORT" elementType="Argument">
            <stringProp name="Argument.name">BASE_PORT</stringProp>
            <stringProp name="Argument.value">\${__P(BASE_PORT,${defaults.basePort})}</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Users" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">\${__P(LOOPS,${defaults.loops})}</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">\${__P(THREADS,${defaults.threads})}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">\${__P(RAMP_UP,${defaults.rampUpSeconds})}</stringProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.duration"></stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
      </ThreadGroup>
      <hashTree>
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Defaults" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">\${BASE_HOST}</stringProp>
          <stringProp name="HTTPSampler.port">\${BASE_PORT}</stringProp>
          <stringProp name="HTTPSampler.protocol">\${BASE_PROTOCOL}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path"></stringProp>
        </ConfigTestElement>
        <hashTree/>
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Browser headers" enabled="true">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Accept</stringProp>
              <stringProp name="Header.value">text/html,application/xhtml+xml</stringProp>
            </elementProp>
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">User-Agent</stringProp>
              <stringProp name="Header.value">Sympos-ia-JMeter/1.0</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>
${samplers}
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const section of config.sections) {
  const jmx = buildJmx(section, config.defaults);
  const file = path.join(outDir, section.planFile);
  fs.writeFileSync(file, jmx.trim() + '\n', 'utf8');
  console.log('Wrote', file);
}

console.log(`Generated ${config.sections.length} test plans.`);
