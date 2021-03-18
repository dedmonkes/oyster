import React, { useState } from 'react';
import { Card, Progress, Spin } from 'antd';
import { Form, Input } from 'antd';
import { INSTRUCTION_LIMIT, TimelockSet } from '../../models/timelock';
import { contexts, ParsedAccount, hooks, utils } from '@oyster/common';
import { addCustomSingleSignerTransaction } from '../../actions/addCustomSingleSignerTransaction';
import { SaveOutlined } from '@ant-design/icons';
import { Connection, PublicKey } from '@solana/web3.js';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;
const { notify } = utils;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

enum UploadType {
  Base64 = 'Base64',
  Upgrade = 'Upgrade',
}

export function NewInstructionCard({
  proposal,
  position,
}: {
  proposal: ParsedAccount<TimelockSet>;
  position: number;
}) {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);

  const onFinish = async (values: {
    slot: string;
    instruction: string;
    destination?: string;
  }) => {
    if (!values.slot.match(/^\d*$/)) {
      notify({
        message: 'Slot can only be numeric',
        type: 'error',
      });
      return;
    }

    let instruction = values.instruction;

    if (sigAccount) {
      await addCustomSingleSignerTransaction(
        connection,
        wallet.wallet,
        proposal,
        sigAccount.pubkey,
        values.slot,
        instruction,
        position,
      );
      form.resetFields();
    }
  };

  return !sigAccount ? null : (
    <Card
      title="New Instruction"
      actions={[<SaveOutlined key="save" onClick={form.submit} />]}
    >
      <Form {...layout} form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item name="slot" label="Slot" rules={[{ required: true }]}>
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="instruction"
          label="Instruction"
          rules={[{ required: true }]}
        >
          <Input.TextArea
            maxLength={INSTRUCTION_LIMIT}
            placeholder={`Base64 encoded Solana Message object with single instruction (call message.serialize().toString('base64')) no more than ${INSTRUCTION_LIMIT} characters`}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}